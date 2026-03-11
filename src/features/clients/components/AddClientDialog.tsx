"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Client, CreateClientInput } from "../types";

const clientFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface AddClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateClientInput) => void;
    initialData?: Client | null;
    isLoading?: boolean;
}

export const AddClientDialog: React.FC<AddClientDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    isLoading,
}) => {
    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            whatsapp: "",
        },
    });

    useEffect(() => {
        if (initialData && open) {
            form.reset({
                name: initialData.name,
                email: initialData.email,
                phone: initialData.phone || "",
                whatsapp: initialData.whatsapp || "",
            });
        } else if (!open) {
            form.reset();
        }
    }, [initialData, open, form]);

    const handleSubmit = (values: ClientFormValues) => {
        onSubmit(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {initialData ? "Edit Client" : "Add New Client"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Acme Inc."
                                            className="bg-slate-950 border-slate-800 focus:ring-blue-500/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-rose-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="admin@acme.com"
                                            className="bg-slate-950 border-slate-800 focus:ring-blue-500/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-rose-400" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Phone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+1 (555) 000-0000"
                                                className="bg-slate-950 border-slate-800 focus:ring-blue-500/50"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-rose-400" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+15550000000"
                                                className="bg-slate-950 border-slate-800 focus:ring-blue-500/50"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-rose-400" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 mt-2 border-t border-slate-800/50 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : initialData ? "Save Changes" : "Add Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
