export interface Sphere {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  sphere_id: string;
  user_id: string;
  name: string;
  description: string;
  progress: number;
  status: "active" | "completed" | "paused" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}
