"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { gql, useMutation } from "@apollo/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "./columns";

const formSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

const UPDATE_CUSTOMER_ROLE = gql`
  mutation UpdateCustomerRole($id: ID!, $role: Role!) {
    updateCustomerRole(id: $id, role: $role) {
      id
      role
    }
  }
`;

interface UpdateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function UpdateRoleDialog({
  open,
  onOpenChange,
  customer,
}: UpdateRoleDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: customer.role,
    },
  });

  const [updateCustomerRole] = useMutation(UPDATE_CUSTOMER_ROLE, {
    onCompleted: () => {
      toast({
        title: "Role updated",
        description: "The customer's role has been updated successfully.",
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
    refetchQueries: ["GetCustomers"],
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateCustomerRole({
      variables: {
        id: customer.id,
        role: values.role,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Customer Role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Role</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}