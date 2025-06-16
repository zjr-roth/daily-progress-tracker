import { supabase } from "../supabase";

// app/lib/services/categoryService.ts
export interface Category {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    textColor: string;
  }

  export class CategoryService {
    static async getUserCategories(userId: string): Promise<Category[]> {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return data?.map(category => ({
          id: category.id,
          name: category.name,
          color: category.color,
          bgColor: category.bg_color,
          textColor: category.text_color,
        })) || [];
      } catch (error) {
        console.error('Error fetching user categories:', error);
        throw error;
      }
    }

    static async createCategory(
      userId: string,
      categoryData: Omit<Category, 'id'>
    ): Promise<Category> {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: categoryData.name,
            color: categoryData.color,
            bg_color: categoryData.bgColor,
            text_color: categoryData.textColor,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('A category with this name already exists');
          }
          throw error;
        }

        return {
          id: data.id,
          name: data.name,
          color: data.color,
          bgColor: data.bg_color,
          textColor: data.text_color,
        };
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    }

    static async updateCategory(
      categoryId: string,
      updates: Partial<Omit<Category, 'id'>>
    ): Promise<Category> {
      try {
        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.color) updateData.color = updates.color;
        if (updates.bgColor) updateData.bg_color = updates.bgColor;
        if (updates.textColor) updateData.text_color = updates.textColor;

        const { data, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', categoryId)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('A category with this name already exists');
          }
          throw error;
        }

        return {
          id: data.id,
          name: data.name,
          color: data.color,
          bgColor: data.bg_color,
          textColor: data.text_color,
        };
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    }

    static async deleteCategory(categoryId: string): Promise<void> {
      try {
        // First, update any tasks using this category to have no category
        await supabase
          .from('tasks')
          .update({ category_id: null })
          .eq('category_id', categoryId);

        // Then delete the category
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    }
  }