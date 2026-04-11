"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { proseFAQ } from "@/constants/faq";
import { HelpCircle } from "lucide-react";

export const FAQ = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-500">
            Everything you need to know about Prose
          </p>
        </div>
      </div>
      {/* @ts-expect-error "<></>" */}
      <Accordion type="single" collapsible className="space-y-3 w-full">
        {proseFAQ.map((item: any) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="w-full block border border-black rounded-xl px-6 data-[state=open]:border-orange-200 data-[state=open]:bg-orange-50/30 transition-all"
          >
            <AccordionTrigger className="w-full flex justify-between items-center text-left font-semibold text-gray-900 hover:no-underline py-4">
              <span className="w-full">{item.question}</span>
            </AccordionTrigger>

            <AccordionContent className="w-full text-gray-600 leading-relaxed pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
        <p className="text-sm text-orange-800 text-center">
          Still have questions?{" "}
          <a href="#" className="font-semibold underline hover:text-orange-900">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQ;
