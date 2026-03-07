"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
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
    List,
    BarChart2
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, ProjectTask, ProjectSubtask } from "@/types/widget";
import KanbanBoard from "../kanban/KanbanBoard";

const PROJECT_COLORS = ["#7C5CFF", "#4ADE80", "#F87171", "#FBBF24", "#38BDF8", "#E879F9"];

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
    const {
        createTask, toggleTask, deleteTask, updateTask, toggleTaskExpand,
        createSubtask, toggleSubtask, deleteSubtask, updateSubtask, recordWork, updateProject, deleteProject
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

            <div className="flex items-start gap-3 mb-2 w-full">
                <div className="w-4 h-4 rounded-full mt-1.5 shrink-0" style={{ background: project.color }} />
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
                        className="text-xl font-bold flex-1 min-w-0 bg-transparent outline-none border-b border-white/20 focus:border-[color:var(--color-accent)] transition-colors break-words text-wrap"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                ) : (
                    <h2
                        className="text-xl font-bold cursor-text hover:opacity-80 transition-opacity flex-1 min-w-0 break-words"
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setHideCompleted(!hideCompleted)}
                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all"
                        style={{ color: hideCompleted ? "var(--color-accent)" : "var(--color-text-secondary)" }}
                        title="Hide completed items"
                    >
                        {hideCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete this project? All tasks will be lost.")) {
                                deleteProject(project.id);
                                onBack();
                            }
                        }}
                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all text-red-500"
                        title="Delete project"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
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
                                    <div className="flex items-start gap-3">
                                        {/* Parent Checkbox */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTask(project.id, task.id); recordWork(project.id); }}
                                            className="w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-all hover:scale-110"
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
                                                    className="flex-1 min-w-0 text-sm cursor-text break-words leading-relaxed transition-all"
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
                                                                className="flex items-start gap-2 group/sub w-full"
                                                            >
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleSubtask(project.id, task.id, st.id); }}
                                                                    className="w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all hover:scale-110"
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
                                                                        className="flex-1 min-w-0 text-xs cursor-text transition-all break-words leading-relaxed"
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
    const { projects, addProject, deleteProject, selectedProjectId: selectedId, setSelectedProjectId: setSelectedId } = useProjectStore();
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [color, setColor] = useState(PROJECT_COLORS[0]);

    // Mouse Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const parallaxX = useTransform(springX, [0, 1000], [5, -5]);
    const parallaxY = useTransform(springY, [0, 1000], [5, -5]);
    const heavyParallaxX = useTransform(springX, [0, 1000], [15, -15]);
    const heavyParallaxY = useTransform(springY, [0, 1000], [15, -15]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    const selected = projects.find((p) => p.id === selectedId);

    if (selected) {
        return (
            <div onMouseMove={handleMouseMove} className="w-full h-full relative overflow-hidden">
                {/* Parallax Background for Detail View */}
                <motion.div
                    style={{ x: parallaxX, y: parallaxY }}
                    className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden"
                >
                    <div className="absolute top-0 left-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                    <div className="absolute top-1/4 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                </motion.div>
                <div className="relative z-10 w-full h-full p-1 overflow-y-auto">
                    <ProjectDetail project={selected} onBack={() => setSelectedId(null)} />
                </div>
            </div>
        );
    }

    const handleCreate = () => {
        if (!name.trim()) return;
        addProject(name.trim(), desc.trim(), color);
        setName("");
        setDesc("");
        setShowCreate(false);
    };

    // Calculate global stats for the fallback insights panel
    const totalProjects = projects.length;
    const activeStreaks = projects.filter(p => p.streakDays > 0).length;
    const globalTasks = projects.reduce((acc, p) => acc + p.tasks.length + p.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0), 0);
    const globalCompleted = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === "done").length + p.tasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0), 0);
    const globalProgress = globalTasks > 0 ? (globalCompleted / globalTasks) * 100 : 0;

    return (
        <div
            onMouseMove={handleMouseMove}
            className="flex flex-col h-full w-full animate-fade-in p-1 overflow-x-hidden relative"
        >
            {/* Fragmentation Layer: Kinetic Background Decoration */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
            >
                <div className="absolute top-0 right-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                <div className="absolute bottom-1/3 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: 15 }}
                    className="absolute top-24 -left-24 w-96 h-96 border border-white opacity-20"
                />
                {/* Kinetic Grain Layer */}
                <div className="absolute inset-0 noise-overlay opacity-[0.15] mix-blend-overlay" />
            </motion.div>

            {/* Editorial Watermark - Kinetic Editorial Layering */}
            <motion.div
                style={{ x: heavyParallaxX, y: heavyParallaxY, color: "var(--color-text-primary)" }}
                className="absolute -top-12 opacity-5 select-none pointer-events-none transition-all duration-700 font-black text-9xl tracking-[-0.05em] translate-y-2"
            >
                PROJECTS
            </motion.div>

            <div className="flex-none flex items-center justify-between mb-6 relative z-10">
                {/* Header Spacer - Maintains editorial balance without redundant text */}
                <div className="h-12" />
                {!showCreate && (
                    <button onClick={() => setShowCreate(true)} className="btn-accent flex items-center gap-2">
                        <Plus size={16} /> New Project
                    </button>
                )}
            </div>

            {/* Create form */}
            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-none bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 mb-6 relative z-10"
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

            {/* Scrollable Container for Grid */}
            <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 relative z-10 ${projects.length < 3 ? "flex flex-col justify-center" : ""}`}>
                <motion.div
                    variants={{
                        animate: { transition: { staggerChildren: 0.1 } }
                    }}
                    initial="initial"
                    animate="animate"
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${projects.length < 3 ? "max-w-5xl mx-auto w-full" : ""}`}
                >
                    <AnimatePresence mode="popLayout">
                        {projects.map((project) => {
                            const projectTotalItems = project.tasks.length + project.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
                            const projectCompletedItems = project.tasks.filter(t => t.status === "done").length +
                                project.tasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
                            const pct = projectTotalItems > 0 ? (projectCompletedItems / projectTotalItems) * 100 : 0;

                            // Get first 2 tasks for inline preview
                            const inlineTasks = project.tasks.slice(0, 2);

                            return (
                                <motion.div
                                    key={project.id}
                                    variants={{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0 }
                                    }}
                                    whileHover={{
                                        y: -8,
                                        scale: 1.02,
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 cursor-pointer group flex flex-col hover:bg-white/[0.05] transition-all h-[180px] relative overflow-hidden"
                                    onClick={() => setSelectedId(project.id)}
                                >
                                    {/* Kinetic Background Fragment for Card */}
                                    <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-white/[0.03] rotate-45 translate-x-12 -translate-y-12 pointer-events-none group-hover:bg-white/[0.01] transition-colors" />
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 max-w-[70%]">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: project.color, boxShadow: `0 0 10px ${project.color}50` }} />
                                            <h3 className="text-sm font-bold truncate text-white/90 group-hover:text-white transition-colors">
                                                {project.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {project.streakDays > 0 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#FBBF24] bg-[#FBBF24]/10 px-1.5 py-0.5 rounded">
                                                    <Flame size={10} /> {project.streakDays}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Today</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Tasks Preview (Fills middle) */}
                                    <div className="flex-1 flex flex-col gap-1.5 mt-2 overflow-hidden mask-bottom">
                                        {inlineTasks.length > 0 ? (
                                            inlineTasks.map(t => (
                                                <div key={t.id} className="flex items-start gap-2 text-xs w-full">
                                                    <div className={`w-3 h-3 mt-0.5 rounded flex items-center justify-center shrink-0 border ${t.status === 'done' ? `bg-[${project.color}] border-transparent` : 'border-white/20'}`}>
                                                        {t.status === 'done' && <Check size={8} className="text-white" />}
                                                    </div>
                                                    <span className={`flex-1 min-w-0 truncate ${t.status === 'done' ? 'text-white/30 line-through' : 'text-white/60'}`}>
                                                        {t.text}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs font-medium text-white/20 italic mt-1">No tasks yet</span>
                                        )}
                                    </div>

                                    {/* Footer / Progress */}
                                    <div className="mt-auto pt-3 border-t border-white/[0.04]">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Progress</span>
                                            <span className="text-[10px] font-bold text-white/60">{projectCompletedItems}/{projectTotalItems}</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, background: project.color, boxShadow: `0 0 10px ${project.color}50` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* ALWAYS FILL EMPTY SPACES */}
                    {projects.length < 3 && (
                        <>
                            {/* Fill Slot 1: Insights Panel */}
                            <motion.div
                                variants={{
                                    initial: { opacity: 0, y: 20 },
                                    animate: { opacity: 1, y: 0 }
                                }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="bg-white/[0.02] border border-white/[0.04] border-dashed rounded-2xl p-4 flex flex-col h-[180px] relative overflow-hidden group/pulse"
                            >
                                <motion.div
                                    style={{ x: parallaxX, y: parallaxY }}
                                    className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border border-white/[0.03] pointer-events-none"
                                />
                                <div className="flex items-center gap-2 mb-4 opacity-50 relative z-10">
                                    <BarChart2 size={14} className="text-white" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-white">Workspace Pulse</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-3 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-white/40">Total Projects</span>
                                        <span className="text-sm font-mono font-bold text-white/80">{totalProjects}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-white/40">Active Streaks</span>
                                        <span className="text-sm font-mono font-bold text-[#FBBF24]">{activeStreaks}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-white/40">Global Completion</span>
                                        <span className="text-sm font-mono font-bold text-[#4ADE80] text-glow">{Math.round(globalProgress)}%</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Fill Slot 2: Quick Actions (only if we only have 0 or 1 projects to keep it to max 3 items) */}
                            {projects.length < 2 && (
                                <motion.div
                                    variants={{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0 }
                                    }}
                                    whileHover={{
                                        y: -5,
                                        backgroundColor: "rgba(255,255,255,0.03)",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                    }}
                                    className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 flex flex-col h-[180px] items-center justify-center text-center gap-3 transition-all cursor-pointer relative overflow-hidden group/action"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <motion.div
                                        whileHover={{ rotate: 90, scale: 1.1 }}
                                        className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center mb-1 group-hover/action:bg-[color:var(--color-accent-glow)] group-hover/action:text-[color:var(--color-accent)] transition-all shadow-lg"
                                    >
                                        <Plus size={20} className="text-white/60 group-hover/action:text-[color:var(--color-accent)]" />
                                    </motion.div>
                                    <span className="text-sm font-bold text-white/60 group-hover/action:text-white transition-colors">Create a New Project</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Quick Action</span>
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
