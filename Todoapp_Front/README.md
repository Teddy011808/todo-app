# My Todos (React)

Homework before the NestJS course: a Todo List app built with React and **local state only** (no backend, no database).

## Run it

```bash
npm install
npm run dev
```

## Features

**Core**
- Each todo has a **Title** and a **Status** (To Do / In Progress / Done)
- Username shown in the top bar and in a greeting ("Good evening, Teddy")
- Two tabs: **Tasks** and **Profile** (clicking your name also opens Profile)
- Profile page with an edit form (username, email, role) and a progress overview
- Full CRUD with `useState`:
  - Create: type a title, pick a status, press Enter or *Add task*
  - Read: the task list with a progress ring
  - Update: click the status circle to cycle the status, or pick it from the status pill; edit a title with the pencil or by double-clicking it
  - Delete: trash icon, with an **Undo** toast

**Bonus**
- Multi-select with *Select all* and a floating bar to bulk change status or delete (with Undo)
- Filter by status (All / To Do / In Progress / Done / Starred) with counts
- Search by title
- Drag and drop to reorder (native HTML5 drag events)
- Star a todo as priority

**Extras**
- Keyboard shortcuts: <kbd>N</kbd> new task, <kbd>/</kbd> search, <kbd>Esc</kbd> clear search
- Helpful empty states, light and dark mode, works on phones

## Structure

```
src/
  App.jsx                 all state + CRUD handlers
  constants.js            statuses, filters, small helpers
  useShortcut.js          keyboard shortcut hook
  components/
    Header.jsx            logo, tabs, user chip
    Tabs.jsx              Tasks / Profile tab bar
    Hero.jsx              greeting + progress ring
    TodoForm.jsx          create a todo
    TodoToolbar.jsx       filters, search, select all
    TodoList.jsx          renders the list, empty states, drag state
    TodoItem.jsx          one todo: select, status, star, edit, delete
    BulkBar.jsx           floating bulk actions
    Toast.jsx             "Deleted · Undo" message
    ProfilePage.jsx       profile card + overview stats
    StatusSelect.jsx      status pill dropdown
    ProgressRing.jsx      circular progress
    Icons.jsx             SVG icons
```
