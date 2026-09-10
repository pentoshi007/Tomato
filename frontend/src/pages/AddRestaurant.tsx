import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../config";
import { BiUpload, BiMapPin, BiStore } from "react-icons/bi";
import { Logo } from "../components/ui/Logo";
import { Spinner } from "../components/ui/primitives";
import LogoutButton from "../components/LogoutButton";
import DemoChip from "../demo/DemoChip";

interface props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loadingLocation, location } = useAppContext();

  const handleSubmit = async () => {
    if (!name || !description || !phone || !image || !location) {
      toast.error("Please fill all the fields");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("phone", phone);
    formData.append("file", image);
    formData.append("latitude", location?.latitude.toString() || "");
    formData.append("longitude", location?.longitude.toString() || "");
    formData.append("formattedAddress", location?.formattedAddress || "");
    try {
      setSubmitting(true);
      await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Restaurant added successfully");
      fetchMyRestaurant();
    } catch (error: unknown) {
      console.log(error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        "Problem in adding restaurant" + (message ? `: ${message}` : ""),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-ink bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo size={32} />
          <div className="flex shrink-0 items-center gap-2">
            <DemoChip />
            <span className="chip hidden bg-mustard sm:inline-flex">
              Seller kitchen
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="text-center">
          <span className="sticker bg-blush">
            <BiStore className="h-4 w-4" /> New kitchen
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Set up your kitchen
          </h1>
          <p className="mt-2 text-sm font-medium text-smoke">
            One form between you and your first order.
          </p>
        </div>

        <div className="card mt-8 space-y-4 p-6">
          <div>
            <label className="label" htmlFor="rest-name">
              Restaurant name
            </label>
            <input
              id="rest-name"
              type="text"
              placeholder="Aniket's Biryani House"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="rest-desc">
              Description
            </label>
            <textarea
              id="rest-desc"
              placeholder="Slow-cooked biryanis, dum-style, since forever…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-20 resize-y"
            />
          </div>

          <div>
            <label className="label" htmlFor="rest-phone">
              Phone
            </label>
            <input
              id="rest-phone"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="input"
            />
          </div>

          <div>
            <span className="label">Cover photo</span>
            <label className="card-flat flex cursor-pointer items-center gap-3 border-dashed p-4 text-sm font-bold text-smoke transition-colors hover:bg-butter">
              <BiUpload className="h-5 w-5 shrink-0 text-tomato" />
              <span className="truncate">
                {image ? image.name : "Upload a cover photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <div className="card-flat flex items-center gap-2.5 !bg-skywash p-3.5 text-xs font-bold">
            <BiMapPin className="h-4 w-4 shrink-0 text-sky" />
            {loadingLocation
              ? "Detecting your kitchen's location…"
              : location
                ? `Location pinned: ${location.formattedAddress || "coordinates captured"}`
                : "Location unavailable — please enable location access"}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || loadingLocation}
            className="btn-primary w-full !py-3"
          >
            {submitting ? (
              <Spinner size={16} className="text-white" />
            ) : (
              <BiStore className="h-5 w-5" />
            )}
            {submitting ? "Opening up…" : "Open my kitchen"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AddRestaurant;
