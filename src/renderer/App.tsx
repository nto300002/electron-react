import { MemoryRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './styles/App.css';

// データ型を定義
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface ElectronWindow extends Window {
  db: {
    loadTodoList: () => Promise<Array<Todo> | null>;
    storeTodoList: (todoList: Array<Todo>) => Promise<void>;
    deleteTodoList: (id: number) => Promise<Array<Todo> | null>;
  };
}

declare const window: ElectronWindow;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </Router>
  );
}

// データ操作
// ToDoリストを読み込み
const loadTodoList = async (): Promise<Array<Todo> | null> => {
  const todoList = await window.db.loadTodoList();
  return todoList;
};

// Todoリストを保存
const storeTodoList = async (todoList: Array<Todo>): Promise<void> => {
  await window.db.storeTodoList(todoList);
};

const HomeScreen = () => {
  const [text, setText] = useState<string>('');
  const [todoList, setTodoList] = useState<Array<Todo>>([]);

  useEffect(() => {
    loadTodoList().then((todoList) => {
      if (todoList) {
        setTodoList(todoList);
      }
    });
  }, []);

  const onSubmit = () => {
    // ボタンクリック時にtodoListに新しいToDOを追加
    if (text !== '') {
      const newTodoList: Array<Todo> = [
        {
          id: new Date().getTime(),
          text: text,
          completed: false,
        },
        ...todoList, // スプレッド構文
      ];
      console.log('newToDoList : ' + JSON.stringify(newTodoList));
      setTodoList(newTodoList);
      storeTodoList(newTodoList);
      // テキストフィールドを空にする
      setText('');
    }
  };

  const onCheck = (newTodo: Todo) => {
    const newTodoList = todoList.map((todo) => {
      return todo.id == newTodo.id
        ? { ...newTodo, completed: !newTodo.completed }
        : todo;
    });
    console.log('newTodoList : ' + newTodoList);
    setTodoList(newTodoList);
    storeTodoList(newTodoList);
  };

  const onDelete = (id: number) => {
    const updateTodoList = todoList.filter((todo: Todo) => todo.id !== id);
    console.log('updateToDoList : ' + updateTodoList);
    setTodoList(updateTodoList);
    storeTodoList(updateTodoList);
  };

  const onUpdate = (id: number, text: string) => {
    const updateTodoList = todoList.map((todo) => {
      return todo.id == id ? { ...todo, text: text } : todo;
    });
    console.log('updateToDoList : ' + JSON.stringify(updateTodoList));
    setTodoList(updateTodoList);
    storeTodoList(updateTodoList);
  };

  return (
    <div>
      <div className="container">
        <div className="input-field">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={onSubmit} className="common-button add-todo-button">
            追加
          </button>
        </div>

        <ul className="todo-list">
          {todoList?.map((todo) => {
            return (
              <Todo
                key={todo.id}
                todo={todo}
                onCheck={onCheck}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const Todo = (props: {
  todo: Todo;
  onCheck: Function;
  onDelete: (id: number) => void;
  onUpdate: Function;
}) => {
  const { todo, onCheck, onDelete, onUpdate } = props;
  const [editText, setEditText] = useState(todo.text);
  // チェック
  const onCheckHandler = () => {
    onCheck(todo);
  };
  // 削除
  const onDeleteHandler = () => {
    onDelete(todo.id);
  };
  // 編集
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
    onUpdate(todo.id, editText);
  };

  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onCheckHandler}
        ></input>
        <input
          id={`input-content-${todo.id}`}
          className="input-content"
          type="text"
          value={editText} // 編集中のテキスト
          onChange={handleEditChange}
          disabled={todo.completed}
        />
        <button
          className="common-button add-delete-button"
          onClick={onDeleteHandler}
        >
          削除
        </button>
      </label>
    </li>
  );
};
