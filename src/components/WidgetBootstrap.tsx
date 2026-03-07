"use client";

import { useEffect } from "react";
import { runtimeLoader } from "@/widgets/runtimeLoader";
import { templateLoader } from "@/widgets/templateLoader";

let bootstrapped = false;

export function WidgetBootstrap() {
    useEffect(() => {
        if (bootstrapped) return;
        bootstrapped = true;
        runtimeLoader();
        templateLoader();
    }, []);

    return null;
}
