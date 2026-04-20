import { useState } from "react";
import { toast } from "react-hot-toast";
import { restaurantService } from "../App";
import axios from "axios";
import { BiUpload } from "react-icons/bi";

const AddMenuItem = ({ onItemAdded }: { onItemAdded: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
  };
  const handleSubmit = async () => {
    if (!name || !description || !price) {
      toast.error("Please fill all the fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    if (image) {
      formData.append("file", image);
    }
    try {
      setLoading(true);
      await axios.post(`${restaurantService}/api/item/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Menu item added successfully");
      resetForm();
      onItemAdded();
    } catch (error) {
      console.log(error);
      toast.error("Problem in adding menu item");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-md space-y-4 m-auto">
      <h2 className="text-lg font-semibold text-center">Add Menu Item</h2>

      <input
        type="text"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
      />
      <textarea
        placeholder="Item Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
      />
      <input
        type="number"
        placeholder="Item Price (₹)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
      />
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border-gray-400 p-4 text-sm hover:bg-gray-50 bg-gray-100">
        <BiUpload className="h-5 w-5 text-[#E23774] " />
        {image ? image.name : "Upload Item Image"}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-lg py-3  text-center text-sm font-semibold text-white bg-[#E23774] hover:bg-[#d91f66] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Add Item"}
      </button>
    </div>
  );
};

export default AddMenuItem;
