// "use client";

// import { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store";
// import { addToCart } from "@/store/slices/cartSlice";
// import { useToast } from "@/hooks/use-toast";
// import { client } from "@/lib/apollo-client";
// import { gql } from "@apollo/client";
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ShoppingCart } from "lucide-react";
// import Image from "next/image";

// // Simple, direct approach
// export function UpsellSection({ cartItems }: any) {
//   const [products, setProducts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const dispatch = useDispatch<AppDispatch>();
//   const { toast } = useToast();

//   useEffect(() => {
//     async function fetchProducts() {
//       try {
//         // Get all products
//         const { data } = await client.query({
//           query: gql`
//             query {
//               products {
//                 id
//                 title
//                 price
//                 discountedPrice
//                 images
//                 isEbook
//                 category {
//                   id
//                   name
//                 }
//               }
//             }
//           `,
//           fetchPolicy: "no-cache" // Force fetch fresh data
//         });

//         if (!data || !data.products) {
//           console.error("No products returned from API");
//           setLoading(false);
//           return;
//         }

//         console.log(`Got ${data.products.length} products`);
        
//         // Get products in cart to exclude them
//         const cartProductIds = new Set();
        
//         // Track categories and product types in cart
//         const cartCategories = new Set();
//         const hasEbooks = cartItems.some((item: any) => item.isEbook);
//         const hasPhysicalBooks = cartItems.some((item: any) => !item.isEbook);
        
//         console.log(`Cart has ebooks: ${hasEbooks}, physical books: ${hasPhysicalBooks}`);
        
//         if (cartItems && cartItems.length > 0) {
//           cartItems.forEach((item: any) => {
//             // Add product ID to exclude list
//             if (item.product && item.product.id) {
//               cartProductIds.add(item.product.id);
//             }
            
//             // Track categories in cart
//             if (item.product?.category?.id) {
//               cartCategories.add(item.product.category.id);
//               console.log(`Added category: ${item.product.category.name} (${item.product.category.id})`);
//             }
//           });
//         }
        
//         console.log("Categories in cart:", Array.from(cartCategories));
//         console.log("Products in cart:", Array.from(cartProductIds));

//         // Filter products by:
//         // 1. Same category as items in cart
//         // 2. Same type (ebook/physical) as items in cart
//         // 3. Not already in cart
//         // 4. Has images
//         const similarProducts = data.products.filter((product: any) => {
//           // Category matching
//           const matchesCategory = product.category && 
//                                 cartCategories.has(product.category.id);
          
//           // Product type matching (ebook vs physical)
//           const matchesType = (product.isEbook && hasEbooks) || 
//                             (!product.isEbook && hasPhysicalBooks);
                            
//           const isNotInCart = !cartProductIds.has(product.id);
//           const hasImages = product.images && product.images.length > 0;
          
//           // For debugging similar products
//           if (matchesCategory && matchesType && isNotInCart) {
//             console.log(`Matching product: ${product.title} (${product.isEbook ? 'ebook' : 'physical'}) - Category: ${product.category?.name}`);
//           }
          
//           return matchesCategory && matchesType && isNotInCart && hasImages;
//         });
        
//         console.log(`Found ${similarProducts.length} similar products with matching category and type`);
        
//         // If no similar products with matching category and type, try just matching category
//         let productsToShow = similarProducts;
//         if (productsToShow.length === 0) {
//           console.log("No category+type matches, trying just category matches");
//           productsToShow = data.products.filter((product: any) => 
//             product.category && 
//             cartCategories.has(product.category.id) &&
//             !cartProductIds.has(product.id) && 
//             product.images && 
//             product.images.length > 0
//           );
          
//           console.log(`Found ${productsToShow.length} products matching just category`);
//         }
        
//         // Last resort: just show any products not in cart
//         if (productsToShow.length === 0) {
//           console.log("No category matches, showing other products");
//           productsToShow = data.products.filter((product: any) => 
//             !cartProductIds.has(product.id) && 
//             product.images && 
//             product.images.length > 0
//           ).slice(0, 8);
//         }
        
//         // Limit to 8 products max
//         if (productsToShow.length > 8) {
//           // Shuffle array to get random selection
//           const shuffled = [...productsToShow].sort(() => 0.5 - Math.random());
//           productsToShow = shuffled.slice(0, 8);
//         }
        
//         setProducts(productsToShow);
//       } catch (error) {
//         console.error("Error fetching products:", error);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchProducts();
//   }, [cartItems]);

//   const handleAddToCart = (product: any) => {
//     try {
//       dispatch(
//         addToCart({
//           productId: product.id,
//           quantity: 1,
//           isEbook: false
//         })
//       );
      
//       toast({
//         title: "Added to cart",
//         description: `${product.title} has been added to your cart.`,
//       });
//     } catch (error) {
//       console.error("Error adding to cart:", error);
//       toast({
//         title: "Error",
//         description: "Failed to add item to cart",
//         variant: "destructive",
//       });
//     }
//   };

//   if (loading) {
//     return <div className="my-8 py-4 text-center">Loading recommendations...</div>;
//   }

//   if (!products || products.length === 0) {
//     return null;
//   }

//   return (
//     <div className="my-8 py-4">
//       <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
      
//       <Carousel className="w-full">
//         <CarouselContent>
//           {products.map((product: any) => (
//             <CarouselItem key={product.id} className="md:basis-1/3 lg:basis-1/4">
//               <Card className="h-full">
//                 <div className="relative aspect-[3/4] w-full">
//                   {product.images && product.images.length > 0 ? (
//                     <Image 
//                       src={product.images[0]} 
//                       alt={product.title}
//                       fill
//                       className="object-cover rounded-t-lg"
//                     />
//                   ) : (
//                     <div className="flex items-center justify-center h-full bg-gray-200 rounded-t-lg">
//                       No Image
//                     </div>
//                   )}
//                 </div>
//                 <CardContent className="p-4">
//                   <h3 className="font-semibold text-sm truncate">{product.title}</h3>
//                   {product.category && (
//                     <p className="text-xs text-muted-foreground mt-1">
//                       {product.category.name}
//                     </p>
//                   )}
//                   <div className="mt-2 flex items-baseline gap-2">
//                     <span className="text-lg font-bold">
//                       ₹{(product.discountedPrice || product.price).toLocaleString()}
//                     </span>
//                     {product.discountedPrice && (
//                       <span className="text-xs text-muted-foreground line-through">
//                         ₹{product.price.toLocaleString()}
//                       </span>
//                     )}
//                   </div>
//                   <Button 
//                     onClick={() => handleAddToCart(product)} 
//                     className="mt-3 w-full"
//                     size="sm"
//                   >
//                     <ShoppingCart className="h-4 w-4 mr-2" />
//                     Add to Cart
//                   </Button>
//                 </CardContent>
//               </Card>
//             </CarouselItem>
//           ))}
//         </CarouselContent>
//         <CarouselPrevious />
//         <CarouselNext />
//       </Carousel>
//     </div>
//   );
// } 

"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { addToCart } from "@/store/slices/cartSlice";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";

// Simple, direct approach
export function UpsellSection({ cartItems }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Get all products
        const { data } = await client.query({
          query: gql`
            query {
              products {
                id
                title
                price
                discountedPrice
                images
                isEbook
                category {
                  id
                  name
                }
              }
            }
          `,
          fetchPolicy: "no-cache" // Force fetch fresh data
        });

        if (!data || !data.products) {
          console.error("No products returned from API");
          setLoading(false);
          return;
        }

        console.log(`Got ${data.products.length} products`);

        // Get products in cart to exclude them
        const cartProductIds = new Set();

        // Track categories and product types in cart
        const cartCategories = new Set();
        let hasEbooks = false;
        let hasPhysicalBooks = false;

        console.log("Cart Items:", cartItems); // Debug: Log cart items

        if (cartItems && cartItems.length > 0) {
          for (const item of cartItems) {
            console.log("Cart Item:", item); // Debug: Log each cart item

            // Add product ID to exclude list
            if (item.product && item.product.id) {
              cartProductIds.add(item.product.id);
            }

            // Fetch category information using item code (product ID)
            const { data: categoryData } = await client.query({
              query: gql`
                query GetCategory($productId: ID!) {
                  product(id: $productId) {
                    category {
                      id
                      name
                    }
                    isEbook
                  }
                }
              `,
              variables: { productId: item.product.id },
            });

            if (categoryData && categoryData.product && categoryData.product.category) {
              const categoryId = categoryData.product.category.id;
              cartCategories.add(categoryId);
              console.log(`Added category: ${categoryData.product.category.name} (${categoryId})`);

              // Track product types in cart
              if (categoryData.product.isEbook) {
                hasEbooks = true;
              } else {
                hasPhysicalBooks = true;
              }
            } else {
              console.log("Item does not have a valid category:", item); // Debug: Log items without valid categories
            }
          }
        }

        console.log("Categories in cart:", Array.from(cartCategories));
        console.log("Products in cart:", Array.from(cartProductIds));
        console.log("Has ebooks:", hasEbooks, "Has physical books:", hasPhysicalBooks);

        // Filter products by:
        // 1. Same category as items in cart
        // 2. Same type (ebook/physical) as items in cart
        // 3. Not already in cart
        // 4. Has images
        const similarProducts = data.products.filter((product: any) => {
          // Category matching
          const matchesCategory = product.category &&
                              cartCategories.has(product.category.id);

          // Product type matching (ebook vs physical)
          const matchesType = (product.isEbook && hasEbooks) ||
                            (!product.isEbook && hasPhysicalBooks);

          const isNotInCart = !cartProductIds.has(product.id);
          const hasImages = product.images && product.images.length > 0;

          // For debugging similar products
          if (matchesCategory && matchesType && isNotInCart) {
            console.log(`Matching product: ${product.title} (${product.isEbook ? 'ebook' : 'physical'}) - Category: ${product.category?.name}`);
          }

          return matchesCategory && matchesType && isNotInCart && hasImages;
        });

        console.log(`Found ${similarProducts.length} similar products with matching category and type`);

        // Limit to 8 products max
        if (similarProducts.length > 8) {
          // Shuffle array to get random selection
          const shuffled = [...similarProducts].sort(() => 0.5 - Math.random());
          setProducts(shuffled.slice(0, 8));
        } else {
          setProducts(similarProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [cartItems]);

  const handleAddToCart = (product: any) => {
    try {
      dispatch(
        addToCart({
          productId: product.id,
          quantity: 1,
          isEbook: product.isEbook
        })
      );

      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="my-8 py-4 text-center">Loading recommendations...</div>;
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="my-8 py-4">
      <h2 className="mb-6 text-2xl font-bold">You might also like</h2>

      <Carousel className="w-full">
        <CarouselContent>
          {products.map((product: any) => (
            <CarouselItem key={product.id} className="md:basis-1/3 lg:basis-1/4">
              <Card className="h-full">
                <div className="relative aspect-[3/4] w-full">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded-t-lg">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm truncate">{product.title}</h3>
                  {product.category && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.category.name}
                    </p>
                  )}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      ₹{(product.discountedPrice || product.price).toLocaleString()}
                    </span>
                    {product.discountedPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="mt-3 w-full"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
