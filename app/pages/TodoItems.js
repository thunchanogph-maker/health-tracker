import { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave } from '@fortawesome/free-solid-svg-icons';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

export default function TodoItem({ user }) {
    // 1. STATE & VARIABLES
    const [newTodo, setNewTodo] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [todos, setTodos] = useState([]);
    const [editingTodo, setEditingTodo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 2. FUNCTIONS (CREATE, READ, UPDATE, DELETE)
    
    // READ
    useEffect(() => {
        const todosRef = ref(db, `users/${user.uid}/todos`);
        const unsubscribe = onValue(todosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const todoList = Object.entries(data).map(([id, todo]) => ({ id, ...todo }));
                setTodos(todoList);
            } else {
                setTodos([]);
            }
        });
        return () => unsubscribe();
    }, [user.uid]);

    // CREATE
    const addTodo = (e) => {
        e.preventDefault();
        if (newTodo.trim() && newDeadline.trim()) {
            push(ref(db, `users/${user.uid}/todos`), { text: newTodo, completed: false, deadline: newDeadline });
            setNewTodo('');
            setNewDeadline('');
        }
    };

    // UPDATE
    const updateTodo = () => {
        if (editingTodo && editingTodo.text.trim()) {
            update(ref(db, `users/${user.uid}/todos/${editingTodo.id}`), {
                text: editingTodo.text
            });
            setEditingTodo(null);
        }
    };

    const toggleTodo = (id, completed) => {
        update(ref(db, `users/${user.uid}/todos/${id}`), { completed: !completed });
    };

    const startEditing = (todo) => {
        setEditingTodo({ ...todo });
    };

    // DELETE
    const deleteTodo = (id) => {
        remove(ref(db, `users/${user.uid}/todos/${id}`));
    };

    // 3. LOGIC (CHARTS & PAGINATION)
    
    // PAGINATION LOGIC
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTodos = todos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(todos.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // CHARTS LOGIC
    const completedTodos = todos.filter(todo => todo.completed).length;
    const incompleteTodos = todos.length - completedTodos;

    const urgentTodos = todos.filter(todo => {
        const deadline = new Date(todo.deadline);
        const today = new Date();
        const diffTime = Math.abs(deadline - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && !todo.completed;
    }).length;

    const nonUrgentTodos = todos.length - urgentTodos;

    const completenessData = {
        labels: ['Completed', 'Incomplete'],
        datasets: [
            {
                label: 'Todos',
                data: [completedTodos, incompleteTodos],
                backgroundColor: ['#4caf50', '#f44336'],
            },
        ],
    };

    const urgencyData = {
        labels: ['Urgent', 'Non-Urgent'],
        datasets: [
            {
                label: 'Todos',
                data: [urgentTodos, nonUrgentTodos],
                backgroundColor: ['#ff9800', '#2196f3'],
            },
        ],
    };

    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { position: 'top' },
        },
    };

    // 4. RENDERING (RETURN JSX)
    return (
        <div className="container mx-auto py-3">
            {/* CHART ELEMENTS */}
            <div className="mb-8 bg-white rounded-lg shadow-md p-4 flex flex-wrap">
                <div className="w-1/2 p-4">
                    <h2 className="text-xl font-bold mb-4">Completeness</h2>
                    <div style={{ height: '200px' }}>
                        <Pie data={completenessData} options={chartOptions} />
                    </div>
                </div>
                <div className="w-1/2 p-4">
                    <h2 className="text-xl font-bold mb-4">Urgency</h2>
                    <div style={{ height: '200px' }}>
                        <Bar data={urgencyData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* FORM SECTION */}
            <form onSubmit={addTodo} className="mb-3">
                <div className="flex">
                    <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a new todo"
                        className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"/>
                    <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)}
                        className="p-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"/>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-r transition duration-300">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Todo
                    </button>
                </div>
            </form>

            {/* READ / UPDATE / DELETE ELEMENTS */}
            {todos.length > 0 ? (
                <div className="space-y-4">
                    {currentTodos.map((todo) => (
                        <div key={todo.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
                            <div className="flex items-center flex-grow">
                                <input type="checkbox" checked={todo.completed}
                                    onChange={() => toggleTodo(todo.id, todo.completed)} className="mr-3 h-5 w-5 text-blue-500" />
                                
                                {/* UPDATE ELEMENTS 1 (Logic inside map) */}
                                {editingTodo && editingTodo.id === todo.id ? (
                                    <input
                                        type="text"
                                        value={editingTodo.text}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, text: e.target.value })}
                                        className="flex-grow mr-2 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <span className={`flex-grow ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                        {todo.text}
                                    </span>
                                )}
                                <span className="ml-4 text-gray-600 mr-5">{todo.deadline}</span>
                            </div>

                            <div className="flex space-x-2">
                                {/* UPDATE ELEMENTS 2 */}
                                {editingTodo && editingTodo.id === todo.id ? (
                                    <button onClick={updateTodo} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition duration-300">
                                        <FontAwesomeIcon icon={faSave} />
                                    </button>
                                ) : (
                                    <button onClick={() => startEditing(todo)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition duration-300">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                )}

                                {/* DELETE ELEMENTS */}
                                <button onClick={() => deleteTodo(todo.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition duration-300">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-600">No todos available</p>
            )}

            {/* PAGINATION ELEMENTS */}
            <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`mx-1 px-3 py-1 border rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}>
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}