export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessment_responses: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          milestone_id: string
          notes: string | null
          response: 'yes' | 'no' | 'sometimes' | 'not_sure'
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          milestone_id: string
          notes?: string | null
          response: 'yes' | 'no' | 'sometimes' | 'not_sure'
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          milestone_id?: string
          notes?: string | null
          response?: 'yes' | 'no' | 'sometimes' | 'not_sure'
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_responses_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: false
            referencedRelation: 'assessments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_responses_milestone_id_fkey'
            columns: ['milestone_id']
            isOneToOne: false
            referencedRelation: 'milestones'
            referencedColumns: ['id']
          }
        ]
      }
      assessment_results: {
        Row: {
          ai_report: string | null
          approved_at: string | null
          assessment_id: string
          category_scores: Json | null
          created_at: string | null
          id: string
          overall_score: number | null
          parent_visible: boolean | null
          physician_notes: string | null
          physician_reviewed: boolean | null
          recommendations: string[] | null
          red_flag_count: number | null
          red_flags: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status:
            | 'pending'
            | 'generating'
            | 'awaiting_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
        }
        Insert: {
          ai_report?: string | null
          approved_at?: string | null
          assessment_id: string
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          parent_visible?: boolean | null
          physician_notes?: string | null
          physician_reviewed?: boolean | null
          recommendations?: string[] | null
          red_flag_count?: number | null
          red_flags?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | 'pending'
            | 'generating'
            | 'awaiting_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
        }
        Update: {
          ai_report?: string | null
          approved_at?: string | null
          assessment_id?: string
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          parent_visible?: boolean | null
          physician_notes?: string | null
          physician_reviewed?: boolean | null
          recommendations?: string[] | null
          red_flag_count?: number | null
          red_flags?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | 'pending'
            | 'generating'
            | 'awaiting_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_results_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: true
            referencedRelation: 'assessments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_results_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      assessments: {
        Row: {
          age_at_assessment_months: number
          child_id: string
          completed_at: string | null
          consent_given: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          guest_session_id: string | null
          id: string
          parent_id: string | null
          started_at: string | null
          status:
            | 'in_progress'
            | 'completed'
            | 'abandoned'
            | 'in_review'
            | 'reviewed'
            | null
        }
        Insert: {
          age_at_assessment_months: number
          child_id: string
          completed_at?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          guest_session_id?: string | null
          id?: string
          parent_id?: string | null
          started_at?: string | null
          status?:
            | 'in_progress'
            | 'completed'
            | 'abandoned'
            | 'in_review'
            | 'reviewed'
            | null
        }
        Update: {
          age_at_assessment_months?: number
          child_id?: string
          completed_at?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          guest_session_id?: string | null
          id?: string
          parent_id?: string | null
          started_at?: string | null
          status?:
            | 'in_progress'
            | 'completed'
            | 'abandoned'
            | 'in_review'
            | 'reviewed'
            | null
        }
        Relationships: [
          {
            foreignKeyName: 'assessments_child_id_fkey'
            columns: ['child_id']
            isOneToOne: false
            referencedRelation: 'children'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      children: {
        Row: {
          child_name: string
          created_at: string | null
          date_of_birth: string
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          id: string
          is_deleted: boolean | null
          parent_id: string
          updated_at: string | null
        }
        Insert: {
          child_name: string
          created_at?: string | null
          date_of_birth: string
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          id?: string
          is_deleted?: boolean | null
          parent_id: string
          updated_at?: string | null
        }
        Update: {
          child_name?: string
          created_at?: string | null
          date_of_birth?: string
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'children_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      milestones: {
        Row: {
          act_early_flag: boolean | null
          age_label: string
          age_months: number
          cdc_verified: boolean | null
          category: 'Social-Emotional' | 'Language/Communication' | 'Cognitive' | 'Motor'
          created_at: string | null
          description: string | null
          disease: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          milestone_code: string
          options: string | null
          question: string
          question_type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          act_early_flag?: boolean | null
          age_label: string
          age_months: number
          cdc_verified?: boolean | null
          category: 'Social-Emotional' | 'Language/Communication' | 'Cognitive' | 'Motor'
          created_at?: string | null
          description?: string | null
          disease?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          milestone_code: string
          options?: string | null
          question: string
          question_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          act_early_flag?: boolean | null
          age_label?: string
          age_months?: number
          cdc_verified?: boolean | null
          category?: 'Social-Emotional' | 'Language/Communication' | 'Cognitive' | 'Motor'
          created_at?: string | null
          description?: string | null
          disease?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          milestone_code?: string
          options?: string | null
          question?: string
          question_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      physician_referrals: {
        Row: {
          approved_at: string | null
          assessment_result_id: string
          created_at: string | null
          id: string
          parent_id: string
          physician_feedback: string | null
          physician_id: string | null
          referral_notes: string | null
          review_status:
            | 'pending'
            | 'in_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
          revision_notes: string | null
          status: 'pending' | 'accepted' | 'completed' | 'declined' | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          assessment_result_id: string
          created_at?: string | null
          id?: string
          parent_id: string
          physician_feedback?: string | null
          physician_id?: string | null
          referral_notes?: string | null
          review_status?:
            | 'pending'
            | 'in_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
          revision_notes?: string | null
          status?: 'pending' | 'accepted' | 'completed' | 'declined' | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          assessment_result_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
          physician_feedback?: string | null
          physician_id?: string | null
          referral_notes?: string | null
          review_status?:
            | 'pending'
            | 'in_review'
            | 'approved'
            | 'needs_revision'
            | 'rejected'
            | null
          revision_notes?: string | null
          status?: 'pending' | 'accepted' | 'completed' | 'declined' | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'physician_referrals_assessment_result_id_fkey'
            columns: ['assessment_result_id']
            isOneToOne: false
            referencedRelation: 'assessment_results'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'physician_referrals_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'physician_referrals_physician_id_fkey'
            columns: ['physician_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: 'parent' | 'physician' | 'admin' | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: 'parent' | 'physician' | 'admin' | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: 'parent' | 'physician' | 'admin' | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      [key: string]: never
    }
  }
}
