export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_training_settings: {
        Row: {
          apply_strict_filter: boolean
          candidate_count: number
          concept_id: string | null
          created_at: string
          created_by: string | null
          domain_id: string | null
          duplicate_similarity_max: number
          enabled: boolean
          fallback_to_bootstrap: boolean
          id: string
          max_output_tokens: number
          model_name: string
          region: string
          scope: string
          style_similarity_min: number
          temperature: number
          top_p: number
          updated_at: string
        }
        Insert: {
          apply_strict_filter?: boolean
          candidate_count?: number
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          domain_id?: string | null
          duplicate_similarity_max?: number
          enabled?: boolean
          fallback_to_bootstrap?: boolean
          id?: string
          max_output_tokens?: number
          model_name?: string
          region?: string
          scope: string
          style_similarity_min?: number
          temperature?: number
          top_p?: number
          updated_at?: string
        }
        Update: {
          apply_strict_filter?: boolean
          candidate_count?: number
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          domain_id?: string | null
          duplicate_similarity_max?: number
          enabled?: boolean
          fallback_to_bootstrap?: boolean
          id?: string
          max_output_tokens?: number
          model_name?: string
          region?: string
          scope?: string
          style_similarity_min?: number
          temperature?: number
          top_p?: number
          updated_at?: string
        }
        Relationships: []
      }
      badge_requirements: {
        Row: {
          badge_id: string
          learning_goal_id: string
        }
        Insert: {
          badge_id: string
          learning_goal_id: string
        }
        Update: {
          badge_id?: string
          learning_goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_requirements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_requirements_goal_id_fkey"
            columns: ["learning_goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      concept_evaluation_methods: {
        Row: {
          concept_id: string
          created_at: string
          evaluation_method_id: string
          id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          evaluation_method_id: string
          id?: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          evaluation_method_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_evaluation_methods_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_evaluation_methods_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_evaluation_methods_evaluation_method_id_fkey"
            columns: ["evaluation_method_id"]
            isOneToOne: false
            referencedRelation: "evaluation_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_learning_strategies: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          strategy_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          strategy_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_learning_strategies_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_learning_strategies_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_learning_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "learning_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_prerequisites: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          prerequisite_concept_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          prerequisite_concept_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          prerequisite_concept_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_prerequisites_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_prerequisites_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_prerequisites_prerequisite_concept_id_fkey"
            columns: ["prerequisite_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_prerequisites_prerequisite_concept_id_fkey"
            columns: ["prerequisite_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_relationships: {
        Row: {
          concept_a_id: string
          concept_b_id: string
          created_at: string
          relationship_type: string
        }
        Insert: {
          concept_a_id: string
          concept_b_id: string
          created_at?: string
          relationship_type: string
        }
        Update: {
          concept_a_id?: string
          concept_b_id?: string
          created_at?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_relationships_concept_a_id_fkey"
            columns: ["concept_a_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_relationships_concept_a_id_fkey"
            columns: ["concept_a_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_relationships_concept_b_id_fkey"
            columns: ["concept_b_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_relationships_concept_b_id_fkey"
            columns: ["concept_b_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_supported_content_formats: {
        Row: {
          concept_id: string
          content_format_id: string
          created_at: string
          id: string
        }
        Insert: {
          concept_id: string
          content_format_id: string
          created_at?: string
          id?: string
        }
        Update: {
          concept_id?: string
          content_format_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_supported_content_formats_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_supported_content_formats_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_supported_content_formats_content_format_id_fkey"
            columns: ["content_format_id"]
            isOneToOne: false
            referencedRelation: "content_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: number
          display_order: number | null
          domain_id: string
          file_id: string | null
          id: string
          metadata: Json | null
          name: string
          parent_concept_id: string | null
          source_file_id: string | null
          status: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: number
          display_order?: number | null
          domain_id: string
          file_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_concept_id?: string | null
          source_file_id?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: number
          display_order?: number | null
          domain_id?: string
          file_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_concept_id?: string | null
          source_file_id?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "domain_extracted_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_concepts_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_concepts_source_file"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "domain_extracted_files"
            referencedColumns: ["id"]
          },
        ]
      }
      content_formats: {
        Row: {
          created_at: string
          description: string | null
          domain_id: string | null
          format_name: string
          id: string
          mime_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          format_name: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          format_name?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_formats_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      difficulty_level_labels: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          domain_id: string | null
          id: string
          label: string
          level_value: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          domain_id?: string | null
          id?: string
          label: string
          level_value: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          domain_id?: string | null
          id?: string
          label?: string
          level_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      domain_extracted_files: {
        Row: {
          bucket_path: string | null
          created_at: string
          domain_id: string
          extracted_text: string | null
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          status: Database["public"]["Enums"]["extraction_status"]
          uploaded_by: string
        }
        Insert: {
          bucket_path?: string | null
          created_at?: string
          domain_id: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          uploaded_by: string
        }
        Update: {
          bucket_path?: string | null
          created_at?: string
          domain_id?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          uploaded_by?: string
        }
        Relationships: []
      }
      domain_feedback_config: {
        Row: {
          aspect: string
          created_at: string
          domain_id: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          aspect: string
          created_at?: string
          domain_id: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          aspect?: string
          created_at?: string
          domain_id?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_feedback_config_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          description: string
          icon_name: string | null
          id: string
          name: string
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_name?: string | null
          id: string
          name: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string | null
          id?: string
          name?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_methods: {
        Row: {
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          input_type:
            | Database["public"]["Enums"]["evaluation_input_type"]
            | null
          method_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          input_type?:
            | Database["public"]["Enums"]["evaluation_input_type"]
            | null
          method_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          input_type?:
            | Database["public"]["Enums"]["evaluation_input_type"]
            | null
          method_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_methods_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json | null
          created_at: string
          exercise_type: string
          id: string
          learning_goal_id: string
          status: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          exercise_type: string
          id?: string
          learning_goal_id: string
          status?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          exercise_type?: string
          id?: string
          learning_goal_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_learning_goal_id_fkey"
            columns: ["learning_goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          created_at: string
          domain_id: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
          uploaded_by_type: Database["public"]["Enums"]["uploaded_by_type"]
        }
        Insert: {
          created_at?: string
          domain_id: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
          uploaded_by_type: Database["public"]["Enums"]["uploaded_by_type"]
        }
        Update: {
          created_at?: string
          domain_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
          uploaded_by_type?: Database["public"]["Enums"]["uploaded_by_type"]
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_achievements: {
        Row: {
          achieved_at: string
          learning_goal_id: string
          student_id: string
        }
        Insert: {
          achieved_at?: string
          learning_goal_id: string
          student_id: string
        }
        Update: {
          achieved_at?: string
          learning_goal_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_achievements_goal_id_fkey"
            columns: ["learning_goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      kv_store_cdba2fd9: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      learning_goal_schemas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          schema_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          schema_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          schema_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_goal_strategies: {
        Row: {
          learning_goal_id: string
          strategy_id: string
        }
        Insert: {
          learning_goal_id: string
          strategy_id: string
        }
        Update: {
          learning_goal_id?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_goal_strategies_goal_id_fkey"
            columns: ["learning_goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_goal_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "learning_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          bloom_level: string | null
          concept_id: string
          created_at: string
          goal_description: string
          goal_type: string | null
          id: string
          metadata_json: Json
          sequence_order: number | null
          status: string
        }
        Insert: {
          bloom_level?: string | null
          concept_id: string
          created_at?: string
          goal_description: string
          goal_type?: string | null
          id?: string
          metadata_json?: Json
          sequence_order?: number | null
          status?: string
        }
        Update: {
          bloom_level?: string | null
          concept_id?: string
          created_at?: string
          goal_description?: string
          goal_type?: string | null
          id?: string
          metadata_json?: Json
          sequence_order?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_goals_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_goals_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_strategies: {
        Row: {
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          strategy_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          strategy_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          strategy_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_strategies_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      motivational_messages: {
        Row: {
          created_at: string
          id: string
          message_text: string
          trigger_condition: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text: string
          trigger_condition: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string
          trigger_condition?: string
        }
        Relationships: []
      }
      page_permissions: {
        Row: {
          id: string
          is_active: boolean
          page_id: string
          role: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          page_id: string
          role: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          page_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_permissions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          description: string
          id: string
          path: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          path: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          path?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          chunk_id: string
          chunk_text: string
          document_id: string
          embedding: string
          extracted_at: string
        }
        Insert: {
          chunk_id?: string
          chunk_text: string
          document_id: string
          embedding: string
          extracted_at?: string
        }
        Update: {
          chunk_id?: string
          chunk_text?: string
          document_id?: string
          embedding?: string
          extracted_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          id: string
          learning_goals: string | null
          preferred_instruments: string[] | null
          skill_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_goals?: string | null
          preferred_instruments?: string[] | null
          skill_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_goals?: string | null
          preferred_instruments?: string[] | null
          skill_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggested_concept_hierarchies: {
        Row: {
          created_at: string
          created_by: string | null
          domain_id: string
          id: string
          status: string
          suggested_structure: Json
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain_id: string
          id?: string
          status?: string
          suggested_structure: Json
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain_id?: string
          id?: string
          status?: string
          suggested_structure?: Json
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_concept_hierarchies_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_types_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_domains: {
        Row: {
          domain_id: string
          id: string
          selected_at: string
          teacher_id: string
        }
        Insert: {
          domain_id: string
          id?: string
          selected_at?: string
          teacher_id: string
        }
        Update: {
          domain_id?: string
          id?: string
          selected_at?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_domains_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          available_for_lessons: boolean | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          hourly_rate: number | null
          id: string
          specialization: string | null
          teaching_languages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_for_lessons?: boolean | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          specialization?: string | null
          teaching_languages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_for_lessons?: boolean | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          specialization?: string | null
          teaching_languages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      concepts_with_difficulty_label: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_label: string | null
          difficulty_level: number | null
          display_order: number | null
          domain_id: string | null
          file_id: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          parent_concept_id: string | null
          source_file_id: string | null
          status: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concepts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "domain_extracted_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concepts_with_difficulty_label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_concepts_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_concepts_source_file"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "domain_extracted_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      debug_current_user_jwt: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          user_email: string
          jwt_role: string
          raw_app_meta_data: Json
          raw_user_meta_data: Json
        }[]
      }
      get_teacher_id_from_file: {
        Args: { file_id: string }
        Returns: string
      }
      set_user_admin_role: {
        Args: { user_email: string }
        Returns: undefined
      }
      set_user_role: {
        Args: { user_id: string; role_name: string }
        Returns: undefined
      }
      test_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      evaluation_input_type:
        | "MIDI"
        | "Audio"
        | "Text"
        | "MCQ"
        | "Video"
        | "Image"
        | "File"
      extraction_status: "pending" | "approved" | "rejected"
      uploaded_by_type: "admin" | "teacher"
      user_type: "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      evaluation_input_type: [
        "MIDI",
        "Audio",
        "Text",
        "MCQ",
        "Video",
        "Image",
        "File",
      ],
      extraction_status: ["pending", "approved", "rejected"],
      uploaded_by_type: ["admin", "teacher"],
      user_type: ["teacher", "student"],
    },
  },
} as const
