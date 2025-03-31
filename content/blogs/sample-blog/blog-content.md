---
title: TypeScript Types Guide
author: Developer Resources
date: March 31, 2025
---

# TypeScript Types Guide

TypeScript adds static typing to JavaScript, helping you catch errors during development rather than at runtime. This guide covers the essential types in TypeScript.

## Basic Types

### Primitive Types

```typescript
// String
let name: string = "TypeScript";

// Number (both integers and floating-point)
let age: number = 25;
let price: number = 19.99;

// Boolean
let isActive: boolean = true;

// Null and Undefined
let empty: null = null;
let notDefined: undefined = undefined;
```

### Special Types

```typescript
// Any - disables type checking (use sparingly)
let dynamic: any = 4;
dynamic = "can be anything";

// Unknown - type-safe version of any
let userInput: unknown = getUserInput();
if (typeof userInput === "string") {
  console.log(userInput.toUpperCase());
}

// Void - absence of any type (common for functions)
function logMessage(msg: string): void {
  console.log(msg);
}

// Never - values that never occur
function throwError(msg: string): never {
  throw new Error(msg);
}
```

## Arrays and Tuples

```typescript
// Array of numbers
let numbers: number[] = [1, 2, 3, 4, 5];
// Alternative syntax
let moreNumbers: Array<number> = [6, 7, 8, 9, 10];

// Array of mixed types
let mixed: (string | number)[] = ["hello", 42];

// Tuple - fixed-length array with ordered types
let person: [string, number, boolean] = ["John", 30, true];
```

## Objects and Interfaces

```typescript
// Object with inline type
let user: { id: number; name: string } = { id: 1, name: "Alice" };

// Interface
interface User {
  id: number;
  name: string;
  email?: string; // Optional property
  readonly createdAt: Date; // Can't be modified after creation
}

// Using the interface
const newUser: User = {
  id: 2,
  name: "Bob",
  createdAt: new Date()
};
```

## Type Aliases

```typescript
// Type alias
type Point = {
  x: number;
  y: number;
};

const position: Point = { x: 10, y: 20 };

// Union type
type ID = string | number;
let userId: ID = 123;
userId = "ABC123"; // Also valid
```

## Functions

```typescript
// Function with parameter and return types
function add(a: number, b: number): number {
  return a + b;
}

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

// Default parameters
function createUser(name: string, active: boolean = true) {
  // ...
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

// Function type
type MathOperation = (x: number, y: number) => number;
const multiply: MathOperation = (a, b) => a * b;
```

## Generics

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

const num = identity<number>(42);
const str = identity("hello"); // Type inference

// Generic interface
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 10 };
const stringBox: Box<string> = { value: "hello" };

// Generic class
class Queue<T> {
  private data: T[] = [];
  
  push(item: T) {
    this.data.push(item);
  }
  
  pop(): T | undefined {
    return this.data.shift();
  }
}

const numberQueue = new Queue<number>();
```

## Advanced Types

### Union and Intersection Types

```typescript
// Union - can be one of multiple types
type Status = "pending" | "approved" | "rejected";
let orderStatus: Status = "pending";

// Intersection - combines multiple types
type Employee = {
  id: number;
  name: string;
};

type Manager = {
  department: string;
  reports: Employee[];
};

type ManagerEmployee = Employee & Manager;
```

### Type Guards

```typescript
// Type guard using typeof
function processValue(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else {
    return value.toFixed(2);
  }
}

// Type guard using instanceof
class Car {
  drive() { /* ... */ }
}

class Bicycle {
  pedal() { /* ... */ }
}

function useVehicle(vehicle: Car | Bicycle) {
  if (vehicle instanceof Car) {
    vehicle.drive();
  } else {
    vehicle.pedal();
  }
}
```

### Utility Types

```typescript
// Partial - makes all properties optional
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>) {
  return { ...todo, ...fieldsToUpdate };
}

// Pick - creates a type with specific properties
type TodoPreview = Pick<Todo, "title" | "completed">;

// Omit - creates a type without specific properties
type TodoInfo = Omit<Todo, "completed">;

// Record - creates an object type with keys and values
type PageInfo = Record<string, string>;
```

## Enums

```typescript
// Numeric enum
enum Direction {
  Up,     // 0
  Down,   // 1
  Left,   // 2
  Right   // 3
}

// String enum
enum HttpStatus {
  OK = "OK",
  NotFound = "NOT_FOUND",
  ServerError = "SERVER_ERROR"
}

let status: HttpStatus = HttpStatus.OK;
```

## Type Assertions

```typescript
// Using 'as' syntax (preferred)
const input = document.getElementById("input") as HTMLInputElement;

// Using angle bracket syntax (not available in JSX)
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
```

## Best Practices

1. Enable strict mode in tsconfig.json
2. Favor interfaces for object shapes
3. Use type aliases for unions and primitive types
4. Avoid using `any` when possible
5. Utilize generics for reusable components
6. Add explicit return types to functions
7. Use readonly for immutable properties