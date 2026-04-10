export interface User {

    _id: string;
    email: string;
    name: string;
    image: string;
    role: string;
   
}
export interface Location {
    latitude: number;
    longitude: number;
    formattedAddress: string;
}
export interface AppContextType {
    user: User | null;
    loading: boolean;
    isAuth: boolean;
   
   
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    location: Location | null;
    loadingLocation: boolean;
    city: string | null;

}