import * as esprima from 'esprima';

import {
  ClassDeclaration,
  FunctionDeclaration,
  LabeledStatement,
  Node,
  VariableDeclarator,
} from 'estree';
import { addToSet } from './util';

type AnySingleNode = Node | null | undefined;
type AnyNode = AnySingleNode | AnySingleNode[];

type ScopeResult = {
  contained: boolean;
  outOfScope: string[];
  localDeclarations: string[];
  externalDeclarations: Record<string, any>;
  hasReturn: boolean;
};

type ScopeOptions = {
  gatherDeclarations: boolean;
};

type IterationResults = {
  isRootFunction: boolean;
};

if (!('structuredClone' in globalThis)) {
  globalThis.structuredClone = (data: any) => JSON.parse(JSON.stringify(data));
}

export const gatherScopeFromNode = (
  node: AnyNode,
  lastScope: ScopeResult = {
    contained: true,
    outOfScope: [],
    hasReturn: false,
    localDeclarations: [],
    externalDeclarations: {},
  },
  options: ScopeOptions = {
    gatherDeclarations: false,
  },
  lastIteration: IterationResults = {
    isRootFunction: true,
  }
): ScopeResult => {
  const currentScope = globalThis.structuredClone(lastScope);
  const currentIteration = globalThis.structuredClone(lastIteration);
  if (!node) {
    return currentScope;
  }

  const addId = (
    node:
      | ClassDeclaration
      | FunctionDeclaration
      | VariableDeclarator
      | LabeledStatement
  ) => {
    const id = node.type === 'LabeledStatement' ? node.label : node.id;
    if (id && id.type === 'Identifier') {
      addToSet(currentScope.localDeclarations, id.name);
    }
  };

  const visitNode = (
    nextNode: AnyNode,
    iteration: IterationResults = currentIteration
  ) => {
    const scope = gatherScopeFromNode(
      nextNode,
      currentScope,
      options,
      iteration
    );

    addToSet(currentScope.outOfScope, scope.outOfScope);
    currentScope.hasReturn = currentScope.hasReturn || scope.hasReturn;

    if (
      (nextNode &&
        !Array.isArray(nextNode) &&
        [
          'ClassDeclaration',
          'FunctionDeclaration',
          'VariableDeclarator',
          'LabeledStatement',
          'Identifier',
        ].includes(nextNode.type)) ||
      (node && !Array.isArray(node) && node.type === 'VariableDeclaration')
    ) {
      addToSet(currentScope.localDeclarations, scope.localDeclarations);
    }

    return scope;
  };

  if (Array.isArray(node)) {
    node.forEach((item) => {
      const blockScope = visitNode(item);
      addToSet(currentScope.localDeclarations, blockScope.localDeclarations);
    });
  } else {
    switch (node.type) {
      case 'ArrayPattern':
        visitNode(node.elements);
        break;
      case 'RestElement':
        visitNode(node.argument);
        break;
      case 'AssignmentPattern':
        visitNode(node.left);
        visitNode(node.right);
        break;
      case 'ObjectPattern':
        visitNode(node.properties);
        break;
      case 'Identifier':
        if (!currentScope.localDeclarations.includes(node.name)) {
          addToSet(currentScope.outOfScope, node.name);
        }
        break;
      case 'ArrayExpression':
        visitNode(node.elements);
        break;
      case 'ObjectExpression':
        visitNode(node.properties);
        break;
      case 'Property':
        visitNode(node.key);
        visitNode(node.value);
        break;
      case 'FunctionExpression':
        visitNode(node.params);
        visitNode(node.body);
        break;
      case 'ArrowFunctionExpression':
        visitNode(node.params);
        visitNode(node.body);
        break;
      case 'ClassExpression':
        visitNode(node.body);
        break;
      case 'ClassBody':
        visitNode(node.body);
        break;
      case 'MethodDefinition':
        visitNode(node.key);
        visitNode(node.value);
        break;
      case 'TaggedTemplateExpression':
        visitNode(node.quasi);
        break;
      case 'TemplateLiteral':
        visitNode(node.expressions);
        break;
      case 'MemberExpression':
        visitNode(node.object);
        // visitNode(node.property);
        break;
      case 'CallExpression':
        visitNode(node.arguments);
        break;
      case 'NewExpression':
        visitNode(node.arguments);
        break;
      case 'SpreadElement':
        visitNode(node.argument);
        break;
      case 'UpdateExpression':
        visitNode(node.argument);
        break;
      case 'AwaitExpression':
        visitNode(node.argument);
        break;
      case 'UnaryExpression':
        visitNode(node.argument);
        break;
      case 'BinaryExpression':
        visitNode(node.left);
        visitNode(node.right);
        break;
      case 'LogicalExpression':
        visitNode(node.left);
        visitNode(node.right);
        break;
      case 'ConditionalExpression':
        visitNode(node.test);
        visitNode(node.consequent);
        visitNode(node.alternate);
        break;
      case 'YieldExpression':
        visitNode(node.argument);
        break;
      case 'AssignmentExpression':
        visitNode(node.left);
        visitNode(node.right);
        break;
      case 'SequenceExpression':
        visitNode(node.expressions);
        break;
      case 'BlockStatement':
        visitNode(node.body);
        break;
      case 'ClassDeclaration':
        addId(node);
        visitNode(node.body);
        break;
      case 'DoWhileStatement':
        visitNode(node.body);
        visitNode(node.test);
        break;
      case 'ExpressionStatement':
        visitNode(node.expression);
        break;
      case 'ForStatement':
        visitNode(node.init);
        visitNode(node.test);
        visitNode(node.update);
        visitNode(node.body);
        break;
      case 'ForInStatement':
        visitNode(node.left);
        visitNode(node.right);
        visitNode(node.body);
        break;
      case 'ForOfStatement':
        visitNode(node.left);
        visitNode(node.right);
        visitNode(node.body);
        break;
      case 'FunctionDeclaration':
        addId(node);
        visitNode(node.params);
        currentIteration.isRootFunction = false;
        visitNode(node.body, { ...currentIteration, isRootFunction: false });
        break;
      case 'IfStatement':
        visitNode(node.test);
        visitNode(node.consequent);
        visitNode(node.alternate);
        break;
      case 'LabeledStatement':
        addId(node);
        visitNode(node.body);
        break;
      case 'ReturnStatement':
        if (currentIteration.isRootFunction) {
          currentScope.hasReturn = true;
        }
        visitNode(node.argument);
        break;
      case 'SwitchStatement':
        visitNode(node.discriminant);
        visitNode(node.cases);
        break;
      case 'SwitchCase':
        visitNode(node.test);
        visitNode(node.consequent);
        break;
      case 'ThrowStatement':
        visitNode(node.argument);
        break;
      case 'TryStatement':
        visitNode(node.block);
        visitNode(node.handler);
        visitNode(node.finalizer);
        break;
      case 'CatchClause':
        visitNode(node.param);
        visitNode(node.body);
        break;
      case 'VariableDeclaration':
        visitNode(node.declarations);
        break;
      case 'VariableDeclarator': {
        visitNode(node.init);
        if (node.id.type === 'Identifier') {
          addId(node);
        } else {
          visitNode(node.id);
        }
        break;
      }
      case 'WhileStatement':
        visitNode(node.test);
        visitNode(node.body);
        break;
      case 'WithStatement':
        visitNode(node.object);
        visitNode(node.body);
        break;
      case 'Program': {
        visitNode(node.body);
        break;
      }
    }
  }

  currentScope.contained = currentScope.outOfScope.length === 0;
  return currentScope;
};

export const gatherScope = (func: Function): ScopeResult => {
  const parsed = esprima.parse(func.toString());
  return gatherScopeFromNode(parsed);
};
