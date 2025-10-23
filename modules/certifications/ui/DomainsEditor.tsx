"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

// Domain type from our schema
interface SubBullet {
  id?: string;
  bulletId?: string;
  text: string;
  order: number;
}

interface Bullet {
  id?: string;
  objectiveId?: string;
  text: string;
  order: number;
  subBullets?: SubBullet[];
}

interface Objective {
  id?: string;
  domainId?: string;
  code: string;
  description: string;
  difficulty: string;
  order: number;
  bullets?: Bullet[];
}

interface Domain {
  id?: string;
  certificationId?: string;
  name: string;
  weight: number; // 0-1 (e.g., 0.24 for 24%)
  order: number;
  objectives: Objective[];
}

interface DomainsEditorProps {
  domains: Domain[];
  onChange: (domains: Domain[]) => void;
  isEditable?: boolean;
}

export function DomainsEditor({ domains, onChange, isEditable = true }: DomainsEditorProps) {
  const [editingDomainIndex, setEditingDomainIndex] = useState<number | null>(null);
  const [editingObjective, setEditingObjective] = useState<{ domainIndex: number; objectiveIndex: number } | null>(null);
  const [editingBullet, setEditingBullet] = useState<{ domainIndex: number; objectiveIndex: number; bulletIndex: number } | null>(null);
  const [editingSubBullet, setEditingSubBullet] = useState<{ domainIndex: number; objectiveIndex: number; bulletIndex: number; subBulletIndex: number } | null>(null);

  const [editDomainForm, setEditDomainForm] = useState<{ name: string; weight: number }>({ name: "", weight: 0 });
  const [editObjectiveForm, setEditObjectiveForm] = useState<{ code: string; description: string; difficulty: string }>({ code: "", description: "", difficulty: "intermediate" });
  const [editBulletForm, setEditBulletForm] = useState<{ text: string }>({ text: "" });
  const [editSubBulletForm, setEditSubBulletForm] = useState<{ text: string }>({ text: "" });

  // Domain operations
  const handleEditDomain = (index: number) => {
    const domain = domains[index];
    setEditDomainForm({ name: domain.name, weight: domain.weight });
    setEditingDomainIndex(index);
  };

  const handleSaveDomain = () => {
    if (editingDomainIndex === null) return;

    // If saving with empty name, remove the domain instead
    if (!editDomainForm.name || editDomainForm.name.trim() === "") {
      handleRemoveDomain(editingDomainIndex);
      setEditingDomainIndex(null);
      setEditDomainForm({ name: "", weight: 0 });
      return;
    }

    const updatedDomains = [...domains];
    updatedDomains[editingDomainIndex] = {
      ...updatedDomains[editingDomainIndex],
      name: editDomainForm.name,
      weight: editDomainForm.weight,
    };
    onChange(updatedDomains);
    setEditingDomainIndex(null);
  };

  const handleCancelDomainEdit = () => {
    // If the domain being edited is empty, remove it
    if (editingDomainIndex !== null) {
      const domain = domains[editingDomainIndex];
      if (!domain.name || domain.name.trim() === "") {
        handleRemoveDomain(editingDomainIndex);
      }
    }
    setEditingDomainIndex(null);
    setEditDomainForm({ name: "", weight: 0 });
  };

  const handleAddDomain = () => {
    const newDomain: Domain = {
      name: "",
      weight: 0,
      order: domains.length,
      objectives: [],
    };
    onChange([...domains, newDomain]);

    // Immediately put the new domain in edit mode
    const newDomainIndex = domains.length;
    setEditDomainForm({ name: "", weight: 0 });
    setEditingDomainIndex(newDomainIndex);
  };

  const handleRemoveDomain = (index: number) => {
    const updatedDomains = domains.filter((_, i) => i !== index);
    onChange(updatedDomains);
  };

  // Objective operations
  const handleEditObjective = (domainIndex: number, objectiveIndex: number) => {
    const objective = domains[domainIndex].objectives[objectiveIndex];
    setEditObjectiveForm({ code: objective.code, description: objective.description, difficulty: objective.difficulty });
    setEditingObjective({ domainIndex, objectiveIndex });
  };

  const handleSaveObjective = () => {
    if (!editingObjective) return;
    const { domainIndex, objectiveIndex } = editingObjective;

    // If saving with empty description, remove the objective instead
    if (!editObjectiveForm.description || editObjectiveForm.description.trim() === "") {
      handleRemoveObjective(domainIndex, objectiveIndex);
      setEditingObjective(null);
      setEditObjectiveForm({ code: "", description: "", difficulty: "intermediate" });
      return;
    }

    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives[objectiveIndex] = {
      ...updatedDomains[domainIndex].objectives[objectiveIndex],
      code: editObjectiveForm.code,
      description: editObjectiveForm.description,
      difficulty: editObjectiveForm.difficulty,
    };
    onChange(updatedDomains);
    setEditingObjective(null);
  };

  const handleCancelObjectiveEdit = () => {
    // If the objective being edited is empty, remove it
    if (editingObjective) {
      const { domainIndex, objectiveIndex } = editingObjective;
      const objective = domains[domainIndex].objectives[objectiveIndex];
      if (!objective.description || objective.description.trim() === "") {
        handleRemoveObjective(domainIndex, objectiveIndex);
      }
    }
    setEditingObjective(null);
    setEditObjectiveForm({ code: "", description: "", difficulty: "intermediate" });
  };

  const handleAddObjective = (domainIndex: number) => {
    const updatedDomains = [...domains];
    const domain = updatedDomains[domainIndex];
    const newObjective: Objective = {
      code: `${domainIndex + 1}.${domain.objectives.length + 1}`,
      description: "",
      difficulty: "intermediate",
      order: domain.objectives.length,
      bullets: [],
    };
    domain.objectives.push(newObjective);
    onChange(updatedDomains);

    // Immediately put the new objective in edit mode
    const newObjectiveIndex = domain.objectives.length - 1;
    setEditObjectiveForm({
      code: `${domainIndex + 1}.${domain.objectives.length}`,
      description: "",
      difficulty: "intermediate"
    });
    setEditingObjective({ domainIndex, objectiveIndex: newObjectiveIndex });
  };

  const handleRemoveObjective = (domainIndex: number, objectiveIndex: number) => {
    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives = updatedDomains[domainIndex].objectives.filter((_, i) => i !== objectiveIndex);
    onChange(updatedDomains);
  };

  // Bullet operations
  const handleEditBullet = (domainIndex: number, objectiveIndex: number, bulletIndex: number) => {
    const bullet = domains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex];
    setEditBulletForm({ text: bullet.text });
    setEditingBullet({ domainIndex, objectiveIndex, bulletIndex });
  };

  const handleSaveBullet = () => {
    if (!editingBullet) return;
    const { domainIndex, objectiveIndex, bulletIndex } = editingBullet;

    // If saving with empty text, remove the bullet instead
    if (!editBulletForm.text || editBulletForm.text.trim() === "") {
      handleRemoveBullet(domainIndex, objectiveIndex, bulletIndex);
      setEditingBullet(null);
      setEditBulletForm({ text: "" });
      return;
    }

    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].text = editBulletForm.text;
    onChange(updatedDomains);
    setEditingBullet(null);
  };

  const handleCancelBulletEdit = () => {
    // If the bullet being edited is empty, remove it
    if (editingBullet) {
      const { domainIndex, objectiveIndex, bulletIndex } = editingBullet;
      const bullet = domains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex];
      if (!bullet.text || bullet.text.trim() === "") {
        handleRemoveBullet(domainIndex, objectiveIndex, bulletIndex);
      }
    }
    setEditingBullet(null);
    setEditBulletForm({ text: "" });
  };

  const handleAddBullet = (domainIndex: number, objectiveIndex: number) => {
    const updatedDomains = [...domains];
    const objective = updatedDomains[domainIndex].objectives[objectiveIndex];
    if (!objective.bullets) objective.bullets = [];
    const newBullet: Bullet = {
      text: "",
      order: objective.bullets.length,
      subBullets: [],
    };
    objective.bullets.push(newBullet);
    onChange(updatedDomains);

    // Immediately put the new bullet in edit mode
    const newBulletIndex = objective.bullets.length - 1;
    setEditingBullet({ domainIndex, objectiveIndex, bulletIndex: newBulletIndex });
    setEditBulletForm({ text: "" });
  };

  const handleRemoveBullet = (domainIndex: number, objectiveIndex: number, bulletIndex: number) => {
    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives[objectiveIndex].bullets = updatedDomains[domainIndex].objectives[objectiveIndex].bullets!.filter((_, i) => i !== bulletIndex);
    onChange(updatedDomains);
  };

  // Sub-bullet operations
  const handleEditSubBullet = (domainIndex: number, objectiveIndex: number, bulletIndex: number, subBulletIndex: number) => {
    const subBullet = domains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].subBullets![subBulletIndex];
    setEditSubBulletForm({ text: subBullet.text });
    setEditingSubBullet({ domainIndex, objectiveIndex, bulletIndex, subBulletIndex });
  };

  const handleSaveSubBullet = () => {
    if (!editingSubBullet) return;
    const { domainIndex, objectiveIndex, bulletIndex, subBulletIndex } = editingSubBullet;

    // If saving with empty text, remove the sub-bullet instead
    if (!editSubBulletForm.text || editSubBulletForm.text.trim() === "") {
      handleRemoveSubBullet(domainIndex, objectiveIndex, bulletIndex, subBulletIndex);
      setEditingSubBullet(null);
      setEditSubBulletForm({ text: "" });
      return;
    }

    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].subBullets![subBulletIndex].text = editSubBulletForm.text;
    onChange(updatedDomains);
    setEditingSubBullet(null);
  };

  const handleCancelSubBulletEdit = () => {
    // If the sub-bullet being edited is empty, remove it
    if (editingSubBullet) {
      const { domainIndex, objectiveIndex, bulletIndex, subBulletIndex } = editingSubBullet;
      const subBullet = domains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].subBullets![subBulletIndex];
      if (!subBullet.text || subBullet.text.trim() === "") {
        handleRemoveSubBullet(domainIndex, objectiveIndex, bulletIndex, subBulletIndex);
      }
    }
    setEditingSubBullet(null);
    setEditSubBulletForm({ text: "" });
  };

  const handleAddSubBullet = (domainIndex: number, objectiveIndex: number, bulletIndex: number) => {
    const updatedDomains = [...domains];
    const bullet = updatedDomains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex];
    if (!bullet.subBullets) bullet.subBullets = [];
    const newSubBullet: SubBullet = {
      text: "",
      order: bullet.subBullets.length,
    };
    bullet.subBullets.push(newSubBullet);
    onChange(updatedDomains);

    // Immediately put the new sub-bullet in edit mode
    const newSubBulletIndex = bullet.subBullets.length - 1;
    setEditingSubBullet({ domainIndex, objectiveIndex, bulletIndex, subBulletIndex: newSubBulletIndex });
    setEditSubBulletForm({ text: "" });
  };

  const handleRemoveSubBullet = (domainIndex: number, objectiveIndex: number, bulletIndex: number, subBulletIndex: number) => {
    const updatedDomains = [...domains];
    updatedDomains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].subBullets = updatedDomains[domainIndex].objectives[objectiveIndex].bullets![bulletIndex].subBullets!.filter((_, i) => i !== subBulletIndex);
    onChange(updatedDomains);
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {domains.map((domain, domainIndex) => {
          const isEditingThisDomain = editingDomainIndex === domainIndex;

          return isEditingThisDomain ? (
            <Card key={domainIndex} className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Domain Name</Label>
                    <Input
                      value={editDomainForm.name}
                      onChange={(e) => setEditDomainForm({ ...editDomainForm, name: e.target.value })}
                      placeholder="Domain name"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weight (%)</Label>
                    <Input
                      type="number"
                      value={(editDomainForm.weight * 100).toString()}
                      onChange={(e) => setEditDomainForm({ ...editDomainForm, weight: parseFloat(e.target.value) / 100 })}
                      placeholder="25"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancelDomainEdit} className="h-7">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveDomain} className="h-7">
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <AccordionItem
              key={domainIndex}
              value={`domain-${domainIndex}`}
              className="border rounded-lg !border-b"
            >
              <div className="relative">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3 text-left flex-1">
                      <span className="font-semibold">Domain {domainIndex + 1}</span>
                      <span className="font-normal">{domain.name}</span>
                      <span className="text-sm text-muted-foreground">({Math.round(domain.weight * 100)}%)</span>
                    </div>
                  </div>
                </AccordionTrigger>
                {isEditable && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDomain(domainIndex);
                      }}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDomain(domainIndex);
                      }}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 pt-2">
                <Accordion type="multiple" className="space-y-2">
                {domain.objectives.map((objective, objectiveIndex) => {
                  const isEditingThisObjective = editingObjective?.domainIndex === domainIndex && editingObjective?.objectiveIndex === objectiveIndex;

                  return isEditingThisObjective ? (
                    <Card className="p-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Objective Code</Label>
                            <Input
                              value={editObjectiveForm.code}
                              onChange={(e) => setEditObjectiveForm({ ...editObjectiveForm, code: e.target.value })}
                              placeholder="e.g., 1.1"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Difficulty</Label>
                            <Select
                              value={editObjectiveForm.difficulty}
                              onValueChange={(value) => setEditObjectiveForm({ ...editObjectiveForm, difficulty: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={editObjectiveForm.description}
                            onChange={(e) => setEditObjectiveForm({ ...editObjectiveForm, description: e.target.value })}
                            placeholder="Objective description"
                            className="h-20"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={handleCancelObjectiveEdit} className="h-7">
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveObjective} className="h-7">
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <AccordionItem
                      key={objectiveIndex}
                      value={`objective-${domainIndex}-${objectiveIndex}`}
                      className="border rounded-lg !border-b"
                    >
                      <div className="relative">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <p className="text-sm text-left flex-1">
                              <span className="font-medium">{objective.code}</span> {objective.description}
                            </p>
                          </div>
                        </AccordionTrigger>
                        {isEditable && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditObjective(domainIndex, objectiveIndex);
                              }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveObjective(domainIndex, objectiveIndex);
                              }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <AccordionContent className="px-4 pb-4">
                        {/* Bullets Section */}
                        {(objective.bullets && objective.bullets.length > 0) || isEditable ? (
                          <div className="space-y-2 pt-2">
                            {objective.bullets?.map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="space-y-1">
                                {editingBullet?.domainIndex === domainIndex && editingBullet?.objectiveIndex === objectiveIndex && editingBullet?.bulletIndex === bulletIndex ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm">•</span>
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={editBulletForm.text}
                                        onChange={(e) => setEditBulletForm({ text: e.target.value })}
                                        className="h-8 text-sm"
                                        placeholder="Enter bullet text"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={handleCancelBulletEdit} className="h-6 text-xs">
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSaveBullet} className="h-6 text-xs">
                                          <Check className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm">•</span>
                                    <span className="text-sm flex-1">{bullet.text}</span>
                                    {isEditable && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleEditBullet(domainIndex, objectiveIndex, bulletIndex)}
                                          className="h-5 w-5"
                                        >
                                          <Pencil className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleRemoveBullet(domainIndex, objectiveIndex, bulletIndex)}
                                          className="h-5 w-5 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Sub-bullets */}
                                {(bullet.subBullets && bullet.subBullets.length > 0) || (isEditable && !editingBullet) ? (
                                  <div className="ml-6 space-y-1">
                                    {bullet.subBullets?.map((subBullet, subBulletIndex) => (
                                      <div key={subBulletIndex}>
                                        {editingSubBullet?.domainIndex === domainIndex && editingSubBullet?.objectiveIndex === objectiveIndex && editingSubBullet?.bulletIndex === bulletIndex && editingSubBullet?.subBulletIndex === subBulletIndex ? (
                                          <div className="flex items-start gap-2">
                                            <span className="text-sm mt-2">◦</span>
                                            <div className="flex-1 space-y-2">
                                              <Input
                                                value={editSubBulletForm.text}
                                                onChange={(e) => setEditSubBulletForm({ text: e.target.value })}
                                                className="h-8 text-sm"
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={handleCancelSubBulletEdit} className="h-6 text-xs">
                                                  <X className="h-3 w-3 mr-1" />
                                                  Cancel
                                                </Button>
                                                <Button size="sm" onClick={handleSaveSubBullet} className="h-6 text-xs">
                                                  <Check className="h-3 w-3 mr-1" />
                                                  Save
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start gap-2">
                                            <span className="text-sm">◦</span>
                                            <span className="text-sm flex-1">{subBullet.text}</span>
                                            {isEditable && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={() => handleEditSubBullet(domainIndex, objectiveIndex, bulletIndex, subBulletIndex)}
                                                  className="h-5 w-5"
                                                >
                                                  <Pencil className="h-2.5 w-2.5" />
                                                </Button>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={() => handleRemoveSubBullet(domainIndex, objectiveIndex, bulletIndex, subBulletIndex)}
                                                  className="h-5 w-5 text-destructive hover:text-destructive"
                                                >
                                                  <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {isEditable && !editingBullet && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm">+</span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddSubBullet(domainIndex, objectiveIndex, bulletIndex)}
                                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          Add Sub-bullet
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                            {isEditable && (
                              <div className="flex items-start gap-2">
                                <span className="text-sm">+</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddBullet(domainIndex, objectiveIndex)}
                                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Add Bullet
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
                </Accordion>
                {domain.objectives.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No objectives yet. Click &quot;Add Objective&quot; to create one.
                  </p>
                )}
                {isEditable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddObjective(domainIndex)}
                    className="h-6 text-xs w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Objective
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          );
        })}
      </Accordion>

      {isEditable && (
        <Button onClick={handleAddDomain} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      )}

      {domains.length === 0 && (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">
            No domains yet. Click &quot;Add Domain&quot; to create one.
          </p>
        </Card>
      )}
    </div>
  );
}
