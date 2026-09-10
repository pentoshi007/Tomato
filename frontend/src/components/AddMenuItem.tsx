import { useState } from "react";
import { toast } from "react-hot-toast";
import { restaurantService } from "../config";
import axios from "axios";
import { BiUpload, BiDish } from "react-icons/bi";
import { Spinner } from "./ui/primitives";

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
      toast.success("Dish added to the menu");
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
    <div className="m-auto max-w-md space-y-4 text-left">
      <div>
        <label className="label" htmlFor="dish-name">Dish name</label>
        <input
          id="dish-name"
          type="text"
          placeholder="Paneer tikka pizza"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="dish-desc">Description</label>
        <textarea
          id="dish-desc"
          placeholder="Smoky paneer, charred peppers, house sauce…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-20 resize-y"
        />
      </div>

      <div>
        <label className="label" htmlFor="dish-price">Price (₹)</label>
        <input
          id="dish-price"
          type="number"
          min="0"
          placeholder="249"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <span className="label">Photo</span>
        <label className="card-flat flex cursor-pointer items-center gap-3 border-dashed p-4 text-sm font-bold text-smoke transition-colors hover:bg-butter">
          <BiUpload className="h-5 w-5 shrink-0 text-tomato" />
          <span className="truncate">
            {image ? image.name : "Upload a dish photo"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full !py-3"
      >
        {loading ? <Spinner size={16} className="text-white" /> : <BiDish className="h-5 w-5" />}
        {loading ? "Adding…" : "Add to menu"}
      </button>
    </div>
  );
};

export default AddMenuItem;
