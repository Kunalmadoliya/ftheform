"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

type FormSettingsBarProps = { isPublished: boolean; responseLimit: number };

export function FormSettingsBar({ isPublished, responseLimit }: FormSettingsBarProps) {
  const [closeSubmissions, setCloseSubmissions] = useState(false);
  const [limit, setLimit] = useState(String(responseLimit));
  return <div className="flex flex-wrap items-end gap-4 border-b bg-muted/20 px-6 py-3"><Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "Published" : "Draft"}</Badge><div className="space-y-1"><Label className="text-xs text-muted-foreground" htmlFor="expires">Expires</Label><Input id="expires" type="date" className="h-8 w-36" /></div><div className="space-y-1"><Label className="text-xs text-muted-foreground">Visibility</Label><Select defaultValue="public"><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label className="text-xs text-muted-foreground" htmlFor="limit">Response limit</Label><Input id="limit" type="number" min="1" value={limit} onChange={(event) => setLimit(event.target.value)} className="h-8 w-28" /></div><label className="flex h-8 items-center gap-2 text-sm"><Switch checked={closeSubmissions} onCheckedChange={setCloseSubmissions} />Close submissions</label><span className="sr-only">These settings are local until backend mutations are available.</span></div>;
}