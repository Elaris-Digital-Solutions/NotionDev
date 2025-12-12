import { Project, Task, Notification, Meeting, TeamSpace, Page } from '@/types/workspace';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Pavimentos Elche',
    description: 'Almacén distribuidor de materiales',
    problem: 'UX/UI medianamente obsoleto y no tiene catálogo digital',
    status: 'not-started',
    priority: 'high',
    progress: 0,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Lendecor',
    description: 'Distribuidor mayorista de lencería',
    problem: 'UX/UI medianamente obsoleto y LENTO. No funciona su catálogo digital',
    status: 'not-started',
    priority: 'medium',
    progress: 0,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Preyser',
    description: 'Empresa dedicada a la venta de productos',
    problem: 'UX/UI obsoleto, catálogo muy poco funcional, sistema de búsqueda roto',
    status: 'not-started',
    priority: 'high',
    progress: 0,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    name: 'La Nave',
    description: 'Tienda física y online de electrónica',
    problem: 'UX/UI medianamente obsoleta. Carrusel de imágenes roto',
    status: 'not-started',
    priority: 'medium',
    progress: 0,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '5',
    name: 'Bianca Moon',
    description: 'Tienda online de zapatos de mujer',
    problem: 'UX/UI medianamente obsoleto, web muy lenta, scrolling roto',
    status: 'not-started',
    priority: 'high',
    progress: 0,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '6',
    name: 'motodirecta.es',
    description: 'Especialistas en la compraventa',
    problem: 'UX/UI muy obsoleto, información desordenada',
    status: 'in-progress',
    priority: 'high',
    progress: 25,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '7',
    name: 'Real TRUCKS',
    description: 'Empresa especializada en la importación',
    problem: 'Página web INSEGURA, UX/UI medianamente obsoleta',
    status: 'in-progress',
    priority: 'high',
    progress: 40,
    createdAt: new Date('2024-03-01'),
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Revisar propuesta de diseño',
    description: 'Revisar la propuesta de diseño para el cliente Pavimentos',
    status: 'in-progress',
    priority: 'high',
    assignee: 'María García',
    dueDate: new Date('2024-12-15'),
    progress: 60,
    createdAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    title: 'Preparar presentación',
    description: 'Crear presentación para reunión con cliente',
    status: 'not-started',
    priority: 'medium',
    assignee: 'Carlos López',
    dueDate: new Date('2024-12-18'),
    progress: 0,
    createdAt: new Date('2024-12-05'),
  },
  {
    id: '3',
    title: 'Actualizar documentación',
    status: 'completed',
    priority: 'low',
    assignee: 'Ana Martínez',
    progress: 100,
    createdAt: new Date('2024-11-28'),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Nueva mención',
    message: 'Carlos te mencionó en "Propuesta Lendecor"',
    read: false,
    createdAt: new Date('2024-12-12T10:30:00'),
  },
  {
    id: '2',
    type: 'assignment',
    title: 'Nueva asignación',
    message: 'Se te asignó la tarea "Revisar diseño"',
    read: false,
    createdAt: new Date('2024-12-12T09:15:00'),
  },
  {
    id: '3',
    type: 'status-change',
    title: 'Cambio de estado',
    message: 'Proyecto "Real TRUCKS" cambió a En progreso',
    read: true,
    createdAt: new Date('2024-12-11T16:45:00'),
  },
];

export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Revisión semanal',
    date: new Date('2024-12-13T10:00:00'),
    attendees: ['María García', 'Carlos López', 'Ana Martínez'],
    notes: 'Revisar avances del sprint',
  },
  {
    id: '2',
    title: 'Presentación cliente',
    date: new Date('2024-12-14T15:00:00'),
    attendees: ['Carlos López', 'Cliente Pavimentos'],
  },
];

export const mockPages: Page[] = [
  { id: '1', title: 'Getting Started', icon: '👋', type: 'blank', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'To Do List', icon: '✅', type: 'database', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: '1:1 notes', icon: '👥', type: 'blank', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', title: 'Scratchpad', icon: '✏️', type: 'blank', createdAt: new Date(), updatedAt: new Date() },
];

export const mockTeamSpaces: TeamSpace[] = [
  {
    id: '1',
    name: 'ELARIS D.S.',
    icon: '🏢',
    pages: [
      { id: 't1', title: 'Backlog del servicio', icon: '🎯', type: 'database', createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', title: 'Links', icon: '🔗', type: 'database', createdAt: new Date(), updatedAt: new Date() },
      { id: 't3', title: 'Clientes Potenciales', icon: '🔍', type: 'database', createdAt: new Date(), updatedAt: new Date() },
      { id: 't4', title: 'Biblioteca de recursos', icon: '📚', type: 'blank', createdAt: new Date(), updatedAt: new Date() },
      { id: 't5', title: "OKR's", icon: '🎯', type: 'database', createdAt: new Date(), updatedAt: new Date() },
      { id: 't6', title: 'Nube de ideas', icon: '💡', type: 'blank', createdAt: new Date(), updatedAt: new Date() },
    ],
  },
];
