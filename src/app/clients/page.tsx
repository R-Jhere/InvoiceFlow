import React from "react";
import Providers from "@/components/providers";
import ClientsContent from "./ClientsContent";

export const dynamic = 'force-dynamic';

export default function ClientsPage() {
    return (
        <Providers>
            <ClientsContent />
        </Providers>
    );
}
