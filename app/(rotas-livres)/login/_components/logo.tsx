'use client'

import azul from "@/public/smul_azul.png";
import branco from "@/public/smul_branco.png";
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Logo() {
    const { theme, systemTheme } = useTheme();
    const tema = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Image
            src={branco}
            alt="SMUL LOGO"
            className="w-48 h-48 object-contain"
        />
    }

    return <Image
        src={tema === "dark" ? branco : azul}
        alt="SMUL LOGO"
        className="w-48 h-48 object-contain"
    />
}