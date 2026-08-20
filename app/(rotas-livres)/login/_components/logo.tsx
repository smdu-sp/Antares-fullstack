'use client'

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
            width={1200}
            height={1200}
            src={"/smul_branco.png"}
            alt="SMUL LOGO"
        />
    }

    return <Image
        width={1200}
        height={1200}
        src={tema === "dark" ? "/smul_branco.png" : "/smul_azul.png"}
        alt="SMUL LOGO"
    />
}