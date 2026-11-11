// Payload of todo.created, todo.updated and todo.deleted
export class TodoEvent {
  constructor(
    public readonly todoId: number,
    public readonly userId: number,
    public readonly title: string,
  ) {}
}
