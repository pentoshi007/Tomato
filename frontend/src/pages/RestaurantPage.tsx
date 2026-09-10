import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { IRestaurant, IMenuItem } from "../types";
import { restaurantService } from "../config";
import axios from "axios";
import { toast } from "react-hot-toast";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import MenuItemModal from "../components/MenuItemModal";
import { useAppContext } from "../context/AppContext";
import { Skeleton, EmptyState } from "../components/ui/primitives";
import { TomatoMark } from "../components/ui/Logo";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const RestaurantPageSkeleton = () => (
  <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
    <div className="card overflow-hidden">
      <Skeleton className="h-44 w-full !rounded-none sm:h-56" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-flat flex gap-4 p-4">
          <Skeleton className="h-24 w-24 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RestaurantPage = () => {
  const { id } = useParams();
  const { fetchMyCart } = useAppContext();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [restaurantRes, itemsRes] = await Promise.all([
          axios.get(`${restaurantService}/api/restaurant/${id}`, {
            headers: authHeaders(),
          }),
          axios.get(`${restaurantService}/api/item/all/${id}`, {
            headers: authHeaders(),
          }),
        ]);
        setRestaurant(restaurantRes.data.restaurant);
        setMenuItems(itemsRes.data.items ?? []);
      } catch (error) {
        console.log(error);
        toast.error("Problem in fetching restaurant");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = async (item: IMenuItem) => {
    if (!id) return;
    try {
      setAddingToCart(true);
      await axios.post(
        `${restaurantService}/api/cart/add`,
        { restaurantId: id, itemId: item._id },
        { headers: authHeaders() },
      );
      toast.success("Added to cart");
      fetchMyCart();
      setSelectedItem(null);
    } catch (error: unknown) {
      console.error(error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        typeof message === "string" ? message : "Problem in adding to cart",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <RestaurantPageSkeleton />;
  if (!restaurant)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<TomatoMark size={52} />}
          title="Restaurant not found"
          body="This kitchen may have closed shop or the link is wrong."
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <RestaurantProfile
        restaurant={restaurant}
        isSeller={false}
        onUpdate={setRestaurant}
      />

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            The menu
          </h2>
          <span className="chip bg-butter">{menuItems.length} dishes</span>
        </div>
        <MenuItems
          items={menuItems}
          restaurantId={id}
          isSeller={false}
          onItemDeleted={() => {}}
          onItemClick={setSelectedItem}
        />
      </section>

      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
        />
      )}
    </div>
  );
};

export default RestaurantPage;
