"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { gql, useMutation, useQuery } from "@apollo/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  discountedPrice: z.coerce.number().min(0).optional().nullable(),
  isEbook: z.boolean().default(false),
  ebookPrice: z.coerce.number().min(0).optional().nullable(),
  ebookDiscounted: z.coerce.number().min(0).optional().nullable(),
  isFree: z.boolean().default(false),
  language: z.enum(["ENGLISH", "HINDI"]),
  stock: z.coerce.number().min(0, "Stock must be positive"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  pdfUrl: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional().nullable(),
});

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      subcategories {
        id
        name
      }
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      title
      description
      price
      discountedPrice
      isEbook
      ebookPrice
      ebookDiscounted
      isFree
      language
      stock
      images
      pdfUrl
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      title
      description
      price
      discountedPrice
      isEbook
      ebookPrice
      ebookDiscounted
      isFree
      language
      stock
      images
      pdfUrl
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      discountedPrice: null,
      isEbook: false,
      ebookPrice: null,
      ebookDiscounted: null,
      isFree: false,
      language: "ENGLISH",
      stock: 0,
      images: [],
      pdfUrl: null,
      categoryId: "",
      subcategoryId: null,
    },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  const [createProduct, { loading: createLoading }] = useMutation(
    CREATE_PRODUCT,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Product created successfully",
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
      refetchQueries: ["GetProducts"],
    }
  );

  const [updateProduct, { loading: updateLoading }] = useMutation(
    UPDATE_PRODUCT,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Product updated successfully",
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
      refetchQueries: ["GetProducts"],
    }
  );

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        isEbook: product.isEbook,
        ebookPrice: product.ebookPrice || null,
        ebookDiscounted: product.ebookDiscounted || null,
        isFree: product.isFree,
        language: product.language,
        stock: product.stock,
        images: product.images,
        pdfUrl: product.pdfUrl || null,
        categoryId: product.category.id,
        subcategoryId: product.subcategory?.id || null,
      });
    } else {
      form.reset();
    }
  }, [product, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const imageUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;
        imageUrls.push(base64);
      } catch (error) {
        console.error("Error converting image to base64:", error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      }
    }

    form.setValue("images", [...form.getValues("images"), ...imageUrls]);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;
      form.setValue("pdfUrl", base64);
    } catch (error) {
      console.error("Error converting PDF to base64:", error);
      toast({
        title: "Error",
        description: "Failed to process PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const input = {
        ...values,
        discountedPrice: values.discountedPrice || undefined,
        ebookPrice: values.ebookPrice || undefined,
        ebookDiscounted: values.ebookDiscounted || undefined,
        pdfUrl: values.pdfUrl || undefined,
        subcategoryId: values.subcategoryId || undefined,
      };

      if (product) {
        await updateProduct({
          variables: {
            id: product.id,
            input,
          },
        });
      } else {
        await createProduct({
          variables: {
            input,
          },
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit" : "Create"} Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discounted Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isEbook"
                render={({ field }) => (
                  <FormItem className="flex flex-col rounded-lg border p-4">
                    <FormLabel className="mb-2">Product Format</FormLabel>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex rounded-md overflow-hidden border border-gray-200">
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                              !field.value
                                ? "bg-[#0a0a8c] text-white"
                                : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                            }`}
                          >
                            Physical Book
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                              field.value
                                ? "bg-[#0a0a8c] text-white"
                                : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                            }`}
                          >
                            E-Book
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {field.value
                          ? "E-Book format is a digital download product. Configure e-book pricing below."
                          : "Physical book format is a printed product that will be shipped to the customer."}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Free</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this product available for free
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("isEbook") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ebookPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Book Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ebookDiscounted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Book Discounted Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ENGLISH">English</SelectItem>
                        <SelectItem value="HINDI">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesData?.categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesData?.categories
                          .find((c: any) => c.id === form.watch("categoryId"))
                          ?.subcategories.map((subcategory: any) => (
                            <SelectItem
                              key={subcategory.id}
                              value={subcategory.id}
                            >
                              {subcategory.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                      <div className="grid grid-cols-4 gap-4">
                        {field.value.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="aspect-square rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("isEbook") && (
              <FormField
                control={form.control}
                name="pdfUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                      />
                    </FormControl>
                    {field.value && (
                      <p className="text-sm text-muted-foreground">
                        PDF file selected
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                ) : product ? (
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
