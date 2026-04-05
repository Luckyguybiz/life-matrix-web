export interface Sphere {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  target_level: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  sphere_id: string;
  user_id: string;
  title: string;
  description: string;
  point_a: string;
  point_b: string;
  progress: number;
  status: "active" | "completed" | "paused" | "archived";
  start_date: string;
  target_date: string | null;
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
  completed_at: string | null;
  created_at: string;
}
