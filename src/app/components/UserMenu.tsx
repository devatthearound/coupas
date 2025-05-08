'use client'

import React, { useState, useRef, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useUser } from "../contexts/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
type UserMenuProps = {
    userName : string;
}

export default function UserMenu({ 
    userName = "-"
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    router.push('/');
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
        <UserCircleIcon className="w-8 h-8 text-gray-500 mr-2" />
        <span className="font-medium">{user?.name}</span>
      </div>
      
      {open && (
        <div className="absolute top-14 right-0 min-w-[220px] bg-white rounded-2xl shadow-lg py-3 z-50">
          <Link href="/settings/coupang" >
            <div className="px-6 py-3 cursor-pointer hover:bg-gray-50 w-full">쿠팡 연동 관리</div>
          </Link>
          {/* <div className="px-6 py-3 cursor-pointer hover:bg-gray-50">유투브 연동 관리</div> */}
          
          <div className="h-px bg-gray-100 my-2"></div>
          <Link href="/settings" >
          <div className="px-6 py-3 cursor-pointer hover:bg-gray-50 w-full">프로필</div>
          </Link>
          
          <Link href="/settings/account" >
            <div className="px-6 py-3 cursor-pointer hover:bg-gray-50 w-full">계정</div>
          </Link>
          
          <div className="h-px bg-gray-100 my-2"></div>
          {/* <div className="px-6 py-3 cursor-pointer hover:bg-gray-50">도움말 센터</div> */}
          <div className="px-6 py-3 cursor-pointer hover:bg-gray-50" onClick={handleLogout}>로그아웃</div>
        </div>
      )}
    </div>
  );
}