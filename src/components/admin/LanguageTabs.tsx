"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface LanguageTabsProps {
  azContent: ReactNode;
  enContent: ReactNode;
  ruContent: ReactNode;
}

export function LanguageTabs({
  azContent,
  enContent,
  ruContent,
}: LanguageTabsProps) {
  return (
    <Tabs defaultValue="az" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="az">AZ</TabsTrigger>
        <TabsTrigger value="en">EN</TabsTrigger>
        <TabsTrigger value="ru">RU</TabsTrigger>
      </TabsList>
      <TabsContent value="az" className="space-y-4">
        {azContent}
      </TabsContent>
      <TabsContent value="en" className="space-y-4">
        {enContent}
      </TabsContent>
      <TabsContent value="ru" className="space-y-4">
        {ruContent}
      </TabsContent>
    </Tabs>
  );
}
