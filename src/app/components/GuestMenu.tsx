import React, { useState, useRef, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useRouter, usePathname } from "next/navigation";
import { isElectron } from '@/utils/environment';

export default function GuestMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = () => {
    if (isElectron()) {
      const electronPath = encodeURIComponent(`coupas-auth://login`);
      const redirectUrl = `https://growsome.kr/login?redirect_to=${electronPath}`;

      router.push(`/external-redirect?url=${encodeURIComponent(redirectUrl)}`);
    } else {
      const redirectTo = encodeURIComponent(`${pathname}`);

      const redirectUrl = `${process.env.NEXT_PUBLIC_GROWSOME_BASE_PATH}/login?redirect_to=${redirectTo}`;

      router.push(redirectUrl);
    }
  };


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div 
        className="flex items-center cursor-pointer px-3 py-2 rounded-full bg-white shadow hover:shadow-md transition-all"
        onClick={() => setOpen(!open)}
      >
        <UserCircleIcon className="w-8 h-8 text-gray-500" />
      </div>
      
      {open && (
        <div className="absolute top-14 right-0 min-w-[220px] bg-white rounded-2xl shadow-lg py-3 z-50">
          <div className="px-6 py-3 cursor-pointer hover:bg-gray-50" onClick={handleLogin}>로그인</div>
          <div className="px-6 py-3 cursor-pointer hover:bg-gray-50" onClick={handleLogin}>회원가입</div>
          
          {/* <div className="h-px bg-gray-100 my-2"></div>
          <div className="px-6 py-3 cursor-pointer hover:bg-gray-50">도움말 센터</div> */}
        </div>
      )}
    </div>
  );
}