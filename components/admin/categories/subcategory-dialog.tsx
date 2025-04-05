"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { gql, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const CREATE_SUBCATEGORY = gql`
  mutation CreateSubcategory($input: SubcategoryInput!) {
    createSubcategory(input: $input) {
      id
      name
      description
      category {
        id
        name
      }
      products {
        id
      }
    }
  }
`;

const UPDATE_SUBCATEGORY = gql`
  mutation UpdateSubcategory($id: ID!, $input: SubcategoryInput!) {
    updateSubcategory(id: $id, input: $input) {
      id
      name
      description
      category {
        id
        name
      }
      products {
        id
      }
    }
  }
`;

interface SubcategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  subcategory?: {
    id: string;
    name: string;
    description?: string;
  };
}

export function SubcategoryDialog({
  open,
  onOpenChange,
  categoryId,
  subcategory,
}: SubcategoryDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [createSubcategory, { loading: createLoading }] = useMutation(
    CREATE_SUBCATEGORY,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Subcategory created successfully",
        });
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
      refetchQueries: ["GetCategory"],
    }
  );

  const [updateSubcategory, { loading: updateLoading }] = useMutation(
    UPDATE_SUBCATEGORY,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Subcategory updated successfully",
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
      refetchQueries: ["GetCategory"],
    }
  );

  useEffect(() => {
    if (subcategory) {
      form.reset({
        name: subcategory.name,
        description: subcategory.description,
      });
    } else {
      form.reset();
    }
  }, [subcategory, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (subcategory) {
        await updateSubcategory({
          variables: {
            id: subcategory.id,
            input: {
              ...values,
              categoryId,
            },
          },
        });
      } else {
        await createSubcategory({
          variables: {
            input: {
              ...values,
              categoryId,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {subcategory ? "Edit" : "Create"} Subcategory
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createLoading || updateLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading || updateLoading}>
                {createLoading || updateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : subcategory ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
