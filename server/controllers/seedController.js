import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";

const demoProducts = [
  {
    name: "Nordic Oak Lounge Chair",
    description: "Hand-finished oak lounge chair with ergonomic contours.",
    price: 249,
    discountPrice: 219,
    category: "Living Room",
    images: ["https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80"],
    stock: 35,
    rating: 4.8,
    reviews: [],
  },
  {
    name: "Mori Dining Table",
    description: "Solid oak dining table with matte protective finish.",
    price: 699,
    discountPrice: 649,
    category: "Dining",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"],
    stock: 12,
    rating: 4.5,
    reviews: [],
  },
  {
    name: "Atlas Office Desk",
    description: "Cable-managed workstation desk with oak top.",
    price: 459,
    discountPrice: 429,
    category: "Home Office",
    images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80"],
    stock: 22,
    rating: 4.6,
    reviews: [],
  },
];

export const seedProducts = asyncHandler(async (req, res) => {
  const { error: deleteError } = await supabase.from("products").delete().not("id", "is", null);
  if (deleteError) {
    res.status(500);
    throw new Error(deleteError.message);
  }

  let count = 0;

  for (const product of demoProducts) {
    const { data: created, error: createError } = await supabase
      .from("products")
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        discount_price: product.discountPrice,
        category: product.category,
        stock: product.stock,
        rating: product.rating,
      })
      .select("id")
      .single();

    if (createError || !created) {
      res.status(500);
      throw new Error(createError?.message || "Failed to seed product");
    }

    if (product.images?.length) {
      const imageRows = product.images.map((imageUrl, index) => ({
        product_id: created.id,
        image_url: imageUrl,
        sort_order: index,
      }));

      const { error: imagesError } = await supabase.from("product_images").insert(imageRows);
      if (imagesError) {
        res.status(500);
        throw new Error(imagesError.message);
      }
    }

    count += 1;
  }

  res.json({ message: "Products seeded", count });
});
