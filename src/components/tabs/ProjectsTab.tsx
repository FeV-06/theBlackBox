"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Check,
    Flame,
    FolderKanban,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project } from "@/types/widget";

const PROJECT_COLORS = ["#7C5CFF", "#4ADE80", "#F87171", "#FBBF24", "#38BDF8", "#E879F9"];

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
    const { addTask, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, recordWork } = useProjectStore();
    const [taskInput, setTaskInput] = useState("");
    const [subInputs, setSubInputs] = useState<Record<string, string>>({});

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.done).length;
    const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

    const handleAddTask = () => {
        if (!taskInput.trim()) return;
        addTask(project.id, taskInput.trim());
        recordWork(project.id);
        setTaskInput("");
    };

    return (
        <div className="animate-fade-in">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm mb-4 hover:text-[color:var(--color-accent)] transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
            >
                <ChevronLeft size={16} /> Back to Projects
            </button>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ background: project.color }} />
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {project.name}
                </h2>
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

            {/* Add task */}
            <div className="flex gap-2 mb-4">
                <input
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    placeholder="Add a task..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={handleAddTask} className="btn-accent px-4">
                    <Plus size={16} />
                </button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2">
                <AnimatePresence>
                    {project.tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { toggleTask(project.id, task.id); recordWork(project.id); }}
                                    className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        borderColor: task.done ? project.color : "rgba(255,255,255,0.15)",
                                        background: task.done ? project.color : "transparent",
                                    }}
                                >
                                    {task.done && <Check size={12} className="text-white" />}
                                </button>
                                <span
                                    className="flex-1 text-sm"
                                    style={{
                                        color: task.done ? "var(--color-text-muted)" : "var(--color-text-primary)",
                                        textDecoration: task.done ? "line-through" : "none",
                                    }}
                                >
                                    {task.text}
                                </span>
                                <button
                                    onClick={() => deleteTask(project.id, task.id)}
                                    className="p-1 rounded hover:bg-white/5 transition-all"
                                    style={{ color: "var(--color-danger)" }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Subtasks */}
                            <div className="ml-8 mt-2 flex flex-col gap-1">
                                {task.subtasks.map((st) => (
                                    <div key={st.id} className="flex items-center gap-2 group">
                                        <button
                                            onClick={() => toggleSubtask(project.id, task.id, st.id)}
                                            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                                            style={{
                                                borderColor: st.done ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
                                                background: st.done ? "var(--color-accent)" : "transparent",
                                            }}
                                        >
                                            {st.done && <Check size={10} className="text-white" />}
                                        </button>
                                        <span
                                            className="flex-1 text-xs"
                                            style={{
                                                color: st.done ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                                                textDecoration: st.done ? "line-through" : "none",
                                            }}
                                        >
                                            {st.text}
                                        </span>
                                        <button
                                            onClick={() => deleteSubtask(project.id, task.id, st.id)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/5"
                                            style={{ color: "var(--color-danger)" }}
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                {/* Add subtask inline */}
                                <input
                                    value={subInputs[task.id] || ""}
                                    onChange={(e) => setSubInputs({ ...subInputs, [task.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && subInputs[task.id]?.trim()) {
                                            addSubtask(project.id, task.id, subInputs[task.id].trim());
                                            setSubInputs({ ...subInputs, [task.id]: "" });
                                        }
                                    }}
                                    placeholder="+ Add subtask"
                                    className="bg-transparent text-xs py-1 outline-none"
                                    style={{ color: "var(--color-text-muted)" }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
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
                        const total = project.tasks.length;
                        const done = project.tasks.filter((t) => t.done).length;
                        const pct = total > 0 ? (done / total) * 100 : 0;
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
                                        {done}/{total}
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
