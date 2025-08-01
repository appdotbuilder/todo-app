
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Task, Category, CreateTaskInput, CreateCategoryInput, Priority } from '../../server/src/schema';

function App() {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Filter state
  const [filterCompleted, setFilterCompleted] = useState<boolean | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<number | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<Priority | undefined>(undefined);

  // Task form state
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null,
    due_date: null,
    priority: 'medium',
    category_id: null
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    color: null
  });

  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Load data functions
  const loadTasks = useCallback(async () => {
    try {
      const filter = {
        ...(filterCompleted !== undefined && { completed: filterCompleted }),
        ...(filterCategory && { category_id: filterCategory }),
        ...(filterPriority && { priority: filterPriority })
      };
      const result = await trpc.getTasks.query(Object.keys(filter).length > 0 ? filter : undefined);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [filterCompleted, filterCategory, filterPriority]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(taskForm);
      setTasks((prev: Task[]) => [...prev, response]);
      setTaskForm({
        title: '',
        description: null,
        due_date: null,
        priority: 'medium',
        category_id: null
      });
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      const updatedTask = await trpc.toggleTaskCompletion.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.map((task: Task) => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, response]);
      setCategoryForm({
        name: '',
        color: null
      });
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryById = (categoryId: number | null) => {
    return categories.find((cat: Category) => cat.id === categoryId);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ Task Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between items-center">
          <div className="flex gap-2">
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={taskForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Enter task title..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTaskForm((prev: CreateTaskInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Add details about your task..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.due_date ? formatDate(taskForm.due_date) : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={taskForm.due_date || undefined}
                          onSelect={(date) => {
                            setTaskForm((prev: CreateTaskInput) => ({
                              ...prev,
                              due_date: date || null
                            }));
                            setIsDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={taskForm.priority}
                      onValueChange={(value: Priority) =>
                        setTaskForm((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select
                      value={taskForm.category_id?.toString() || 'none'}
                      onValueChange={(value) =>
                        setTaskForm((prev: CreateTaskInput) => ({
                          ...prev,
                          category_id: value === 'none' ? null : parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTaskDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Name *</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter category name..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryColor">Color (hex)</Label>
                    <Input
                      id="categoryColor"
                      value={categoryForm.color || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({
                          ...prev,
                          color: e.target.value || null
                        }))
                      }
                      placeholder="#3B82F6"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Creating...' : 'Create Category'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline" 
                      onClick={() => setIsCategoryDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Tasks</h4>
                
                <div>
                  <Label>Completion Status</Label>
                  <Select
                    value={filterCompleted === undefined ? 'all' : filterCompleted.toString()}
                    onValueChange={(value) =>
                      setFilterCompleted(value === 'all' ? undefined : value === 'true')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tasks</SelectItem>
                      <SelectItem value="false">Incomplete</SelectItem>
                      <SelectItem value="true">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={filterCategory?.toString() || 'all'}
                    onValueChange={(value) =>
                      setFilterCategory(value === 'all' ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.length > 0 && categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select
                    value={filterPriority || 'all'}
                    onValueChange={(value) =>
                      setFilterPriority(value === 'all' ? undefined : value as Priority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterCompleted(undefined);
                    setFilterCategory(undefined);
                    setFilterPriority(undefined);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter((task: Task) => task.completed).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter((task: Task) => task.due_date && isOverdue(task.due_date) && !task.completed).length}
                </div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500 text-lg mb-2">📝</div>
                <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
                <p className="text-sm text-gray-400 mt-2">
                  ⚠️ Note: Server handlers are currently using stub data. Tasks created here won't persist.
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task: Task) => {
              const category = getCategoryById(task.category_id);
              const overdue = task.due_date && isOverdue(task.due_date) && !task.completed;
              
              return (
                <Card key={task.id} className={`transition-all hover:shadow-md ${task.completed ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {category && (
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: category.color || undefined,
                                color: category.color || undefined 
                              }}
                            >
                              {category.name}
                            </Badge>
                          )}
                          {overdue && (
                            <Badge variant="destructive">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className={`text-gray-600 text-sm ${task.completed ? 'line-through' : ''}`}>
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {task.due_date && (
                            <span className={overdue ? 'text-red-600 font-medium' : ''}>
                              📅 Due: {formatDate(task.due_date)}
                            </span>
                          )}
                          <span>Created: {formatDate(task.created_at)}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Categories List */}
        {categories.length > 0 && (
          <div className="mt-8">
            <Separator className="mb-4" />
            <h2 className="text-xl font-semibold mb-4">📂 Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category: Category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="text-sm py-1"
                  style={{
                    borderColor: category.color || undefined,
                    color: category.color || undefined
                  }}
                >
                  {category.name} ({tasks.filter((task: Task) => task.category_id === category.id).length})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
