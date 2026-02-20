"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Check,
    Flame,
    FolderKanban,
    ChevronDown,
    EyeOff,
    Eye,
    LayoutGrid,
    List
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, ProjectTask, ProjectSubtask } from "@/types/widget";
import KanbanBoard from "../kanban/KanbanBoard";

const PROJECT_COLORS = ["#7C5CFF", "#4ADE80", "#F87171", "#FBBF24", "#38BDF8", "#E879F9"];

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
    const {
        createTask, toggleTask, deleteTask, updateTask, toggleTaskExpand,
        createSubtask, toggleSubtask, deleteSubtask, updateSubtask, recordWork, updateProject
    } = useProjectStore();

    const [taskInput, setTaskInput] = useState("");
    const [subInputs, setSubInputs] = useState<Record<string, string>>({});

    // Inline editing states
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskText, setEditTaskText] = useState("");

    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [editSubtaskText, setEditSubtaskText] = useState("");

    // Inline-editable project title
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState(project.name);

    // UI filters
    const [hideCompleted, setHideCompleted] = useState(false);

    // Dynamic Progress Calculation
    const totalItems = project.tasks.length + project.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
    const completedItems = project.tasks.filter(t => t.status === "done").length +
        project.tasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
    const progress = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

    const handleCreateTask = () => {
        if (!taskInput.trim()) return;
        createTask(project.id, taskInput.trim());
        recordWork(project.id);
        setTaskInput("");
    };

    // Derived states based on filter
    const visibleTasks = hideCompleted ? project.tasks.filter(t => t.status !== "done") : project.tasks;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-sm hover:text-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    <ChevronLeft size={16} /> Back to Projects
                </button>
            </div>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ background: project.color }} />
                {editingTitle ? (
                    <input
                        autoFocus
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" && titleText.trim()) {
                                updateProject(project.id, { name: titleText.trim() });
                                setEditingTitle(false);
                            } else if (e.key === "Escape") {
                                setTitleText(project.name);
                                setEditingTitle(false);
                            }
                        }}
                        onBlur={() => {
                            if (titleText.trim()) updateProject(project.id, { name: titleText.trim() });
                            setEditingTitle(false);
                        }}
                        className="text-xl font-bold bg-transparent outline-none border-b border-white/20 focus:border-[color:var(--color-accent)] transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                ) : (
                    <h2
                        className="text-xl font-bold cursor-text hover:opacity-80 transition-opacity"
                        style={{ color: "var(--color-text-primary)" }}
                        onClick={() => {
                            setTitleText(project.name);
                            setEditingTitle(true);
                        }}
                    >
                        {project.name}
                    </h2>
                )}
                {project.streakDays > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(251,191,36,0.12)", color: "var(--color-warning)" }}>
                        <Flame size={12} /> {project.streakDays} day streak
                    </span>
                )}
            </div>

            {project.description && (
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                    {project.description}
                </p>
            )}

            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: project.color }}
                    />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {Math.round(progress)}%
                </span>
            </div>

            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex bg-white/[0.05] p-1 rounded-xl w-max">
                    <button
                        onClick={() => updateProject(project.id, { viewMode: "list" })}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${project.viewMode !== "kanban" ? "bg-white/10 shadow text-white" : "text-white/50 hover:text-white"}`}
                    >
                        <List size={16} /> List
                    </button>
                    <button
                        onClick={() => updateProject(project.id, { viewMode: "kanban" })}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${project.viewMode === "kanban" ? "bg-white/10 shadow text-white" : "text-white/50 hover:text-white"}`}
                    >
                        <LayoutGrid size={16} /> Board
                    </button>
                </div>

                <button
                    onClick={() => setHideCompleted(!hideCompleted)}
                    className="h-10 px-3 flex items-center justify-center rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all"
                    style={{ color: hideCompleted ? "var(--color-accent)" : "var(--color-text-secondary)" }}
                    title="Hide completed items"
                >
                    {hideCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                <input
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                    placeholder="Add a task to To-Do..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={handleCreateTask} className="btn-accent px-4 py-2.5 rounded-xl">
                    <Plus size={16} />
                </button>
            </div>

            {project.viewMode === "kanban" ? (
                <KanbanBoard project={project} hideCompleted={hideCompleted} />
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Tasks */}
                    <div className="flex flex-col gap-2">
                        <AnimatePresence>
                            {visibleTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: task.status === "done" ? 0.6 : 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="glass-card p-4 relative group"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Parent Checkbox */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTask(project.id, task.id); recordWork(project.id); }}
                                            className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all hover:scale-110"
                                            style={{
                                                borderColor: task.status === "done" ? project.color : "rgba(255,255,255,0.15)",
                                                background: task.status === "done" ? project.color : "transparent",
                                            }}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ scale: task.status === "done" ? 1 : 0, opacity: task.status === "done" ? 1 : 0 }}
                                            >
                                                <Check size={12} className="text-white" />
                                            </motion.div>
                                        </button>

                                        {/* Parent Text (Inline Editable) */}
                                        <div className="flex-1 min-w-0 flex items-center">
                                            {editingTaskId === task.id ? (
                                                <input
                                                    autoFocus
                                                    value={editTaskText}
                                                    onChange={(e) => setEditTaskText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") {
                                                            updateTask(project.id, task.id, { text: editTaskText.trim() });
                                                            setEditingTaskId(null);
                                                        } else if (e.key === "Escape") {
                                                            setEditingTaskId(null);
                                                        } else if (e.key === "Backspace" && editTaskText === "") {
                                                            deleteTask(project.id, task.id);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (editTaskText.trim()) updateTask(project.id, task.id, { text: editTaskText.trim() });
                                                        setEditingTaskId(null);
                                                    }}
                                                    className="w-full bg-transparent outline-none text-sm text-[color:var(--color-text-primary)]"
                                                />
                                            ) : (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditTaskText(task.text);
                                                        setEditingTaskId(task.id);
                                                    }}
                                                    className="flex-1 text-sm cursor-text truncate transition-all"
                                                    style={{
                                                        textDecoration: task.status === "done" ? "line-through" : "none",
                                                    }}
                                                >
                                                    {task.text}
                                                </span>
                                            )}
                                        </div>

                                        {/* Expand/Collapse Subtasks */}
                                        {(task.subtasks?.length > 0 || subInputs[task.id]) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTaskExpand(project.id, task.id); }}
                                                className="p-1 rounded hover:bg-white/5 transition-all opacity-40 hover:opacity-100"
                                            >
                                                <motion.div animate={{ rotate: task.isExpanded ? 180 : 0 }}>
                                                    <ChevronDown size={14} />
                                                </motion.div>
                                            </button>
                                        )}

                                        {/* Delete Parent */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTask(project.id, task.id); }}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Subtasks Section */}
                                    <AnimatePresence>
                                        {task.isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-8 mt-3 flex flex-col gap-2 border-l border-white/[0.05] pl-3">
                                                    {task.subtasks?.map((st) => {
                                                        if (hideCompleted && st.completed) return null; // Hide subtasks individually if filtered
                                                        return (
                                                            <motion.div
                                                                key={st.id}
                                                                layout
                                                                initial={{ opacity: 0, x: -5 }}
                                                                animate={{ opacity: st.completed ? 0.6 : 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -5 }}
                                                                className="flex items-center gap-2 group/sub"
                                                            >
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleSubtask(project.id, task.id, st.id); }}
                                                                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all hover:scale-110"
                                                                    style={{
                                                                        borderColor: st.completed ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
                                                                        background: st.completed ? "var(--color-accent)" : "transparent",
                                                                    }}
                                                                >
                                                                    <motion.div initial={false} animate={{ scale: st.completed ? 1 : 0, opacity: st.completed ? 1 : 0 }}>
                                                                        <Check size={10} className="text-white" />
                                                                    </motion.div>
                                                                </button>

                                                                {/* Subtask Text (Inline Editable) NOT IMPLEMENTED FULLY BUT SIMPLE SPAN HERE */}
                                                                {editingSubtaskId === st.id ? (
                                                                    <input
                                                                        autoFocus
                                                                        value={editSubtaskText}
                                                                        onChange={(e) => setEditSubtaskText(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            e.stopPropagation();
                                                                            if (e.key === "Enter" && editSubtaskText.trim()) {
                                                                                updateSubtask(project.id, task.id, st.id, { text: editSubtaskText.trim() });
                                                                                setEditingSubtaskId(null);
                                                                            } else if (e.key === "Escape") {
                                                                                setEditingSubtaskId(null);
                                                                            } else if (e.key === "Backspace" && editSubtaskText === "") {
                                                                                deleteSubtask(project.id, task.id, st.id);
                                                                                setEditingSubtaskId(null);
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            if (editSubtaskText.trim()) {
                                                                                updateSubtask(project.id, task.id, st.id, { text: editSubtaskText.trim() });
                                                                            }
                                                                            setEditingSubtaskId(null);
                                                                        }}
                                                                        className="flex-1 bg-transparent border-b border-white/20 outline-none text-xs text-[color:var(--color-text-secondary)]"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditSubtaskText(st.text);
                                                                            setEditingSubtaskId(st.id);
                                                                        }}
                                                                        className="flex-1 text-xs cursor-text transition-all"
                                                                        style={{
                                                                            color: st.completed ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                                                                            textDecoration: st.completed ? "line-through" : "none",
                                                                        }}
                                                                    >
                                                                        {st.text}
                                                                    </span>
                                                                )}

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteSubtask(project.id, task.id, st.id); }}
                                                                    className="opacity-0 group-hover/sub:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500/50 hover:text-red-400 transition-all"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </motion.div>
                                                        );
                                                    })}

                                                    {/* Add subtask inline */}
                                                    <input
                                                        value={subInputs[task.id] || ""}
                                                        onChange={(e) => {
                                                            // Ensure subtask expansion opens when typings
                                                            if (!task.isExpanded) toggleTaskExpand(project.id, task.id);
                                                            setSubInputs({ ...subInputs, [task.id]: e.target.value })
                                                        }}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === "Enter" && subInputs[task.id]?.trim()) {
                                                                createSubtask(project.id, task.id, subInputs[task.id].trim());
                                                                setSubInputs({ ...subInputs, [task.id]: "" });
                                                            }
                                                        }}
                                                        placeholder="Add subtask..."
                                                        className="bg-transparent text-xs py-1 outline-none ml-6"
                                                        style={{ color: "var(--color-text-muted)" }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProjectsTab() {
    const { projects, addProject, deleteProject } = useProjectStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [color, setColor] = useState(PROJECT_COLORS[0]);

    const selected = projects.find((p) => p.id === selectedId);

    if (selected) {
        return <ProjectDetail project={selected} onBack={() => setSelectedId(null)} />;
    }

    const handleCreate = () => {
        if (!name.trim()) return;
        addProject(name.trim(), desc.trim(), color);
        setName("");
        setDesc("");
        setShowCreate(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                        Projects
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Manage your projects with tasks and subtasks
                    </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-accent flex items-center gap-2">
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5 mb-6"
                >
                    <h3 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
                        Create Project
                    </h3>
                    <div className="flex flex-col gap-3">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name"
                            className="bg-white/[0.03] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <input
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="bg-white/[0.03] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <div className="flex gap-2">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className="w-7 h-7 rounded-lg transition-all"
                                    style={{
                                        background: c,
                                        outline: color === c ? "2px solid white" : "none",
                                        outlineOffset: 2,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="btn-accent">Create</button>
                            <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Projects grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                    {projects.map((project) => {
                        const projectTotalItems = project.tasks.length + project.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
                        const projectCompletedItems = project.tasks.filter(t => t.status === "done").length +
                            project.tasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
                        const pct = projectTotalItems > 0 ? (projectCompletedItems / projectTotalItems) * 100 : 0;

                        return (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-5 cursor-pointer group"
                                onClick={() => setSelectedId(project.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
                                        <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                                            {project.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {project.streakDays > 0 && (
                                            <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--color-warning)" }}>
                                                <Flame size={11} /> {project.streakDays}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteProject(project.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5"
                                            style={{ color: "var(--color-danger)" }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                {project.description && (
                                    <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {project.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, background: project.color }}
                                        />
                                    </div>
                                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                        {projectCompletedItems}/{projectTotalItems}
                                    </span>
                                    <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {projects.length === 0 && !showCreate && (
                <div className="text-center py-16">
                    <FolderKanban size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No projects yet. Click &quot;New Project&quot; to get started!
                    </p>
                </div>
            )}
        </div>
    );
}
