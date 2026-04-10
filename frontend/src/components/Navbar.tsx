
import { useAppContext } from '../context/AppContext';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BiMapPin, BiSearch } from 'react-icons/bi';
import { CgShoppingCart } from 'react-icons/cg';

const Navbar = () => {
    const { isAuth, city } = useAppContext();
    const currLocation = useLocation();
    const isHomePage = currLocation.pathname === "/";
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim() !== "") {
                setSearchParams({ search: search.trim() });
            } else {
                setSearchParams({});
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, setSearchParams]);

    return (
        <div className='w-full bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 flex items-center justify-between py-3'>
                <Link to="/" className='text-2xl font-bold text-[#E23774] cursor-pointer'>Tomato</Link>
                <div className='flex items-center gap-2'>
                    <Link to={'/cart'} className='relative'>
                        <CgShoppingCart className='h-6 w-6  text-[#E23774]' />
                        <span className='absolute -top-2 -right-0 flex items-center justify-center rounded-full bg-red-500 text-white text-xs w-5 h-5 font-semibold'>0</span>
                    </Link>
                    {isAuth
                        ? <Link to={'/account'} className='font-medium text-[#E23774]'>Account</Link>
                        : <Link to={'/login'} className='font-medium text-[#E23774]'>Login</Link>
                    }
                </div>
            </div>
            {isHomePage && (
                <div className='border-t px-4 py-3'>
                    <div className='mx-auto flex max-w-7xl items-center rounded-lg border shadow-sm'>
                        <div className='flex items-center gap-2 px-3 border-r text-gray-700'>
                            <BiMapPin className='h-4 w-4 text-[#E23774]' />
                            <span className='text-sm truncate max-w-35'>{city}</span>
                        </div>
                        <div className='flex flex-1 items-center gap-2 px-3'>
                            <BiSearch className='h-4 w-4 text-gray-400' />
                            <input
                                type='text'
                                placeholder="Search for restaurants"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full outline-none text-sm py-2 placeholder:text-gray-400'
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Navbar;