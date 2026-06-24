import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { IRestaurant, IMenuItem } from "../types";
import { restaurantService } from "../App";
import axios from "axios";
import { toast } from "react-hot-toast";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import MenuItemModal from "../components/MenuItemModal";
import { useAppContext } from "../context/AppContext";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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
      toast.success("Item added to cart successfully");
      fetchMyCart();
      setSelectedItem(null);
    } catch (error) {
      console.log(error);
      toast.error("Problem in adding to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="p-4">Loading restaurant ...</div>;
  if (!restaurant) return <div className="p-4">Restaurant not found.</div>;

  return (
    <div className="p-4 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        isSeller={false}
        onUpdate={setRestaurant}
      />
      <div className="mx-auto max-w-5xl rounded-xl bg-white shadow-sm p-4">
        <h2 className="mb-3 text-lg font-semibold">Menu</h2>
        <MenuItems
          items={menuItems}
          isSeller={false}
          onItemDeleted={() => {}}
          onItemClick={setSelectedItem}
        />
      </div>
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
