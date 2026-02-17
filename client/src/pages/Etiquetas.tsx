// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from "lucide-react";

const colorOptions = [
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "teal", label: "Turquesa", class: "bg-teal-500" },
  { value: "gray", label: "Cinza", class: "bg-gray-500" },
];

export default function Etiquetas() {
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "blue",
    description: "",
  });

  const tagsQuery = trpc.tags.getAll.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const createMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      tagsQuery.refetch();
      setIsCreateOpen(false);
      setFormData({ name: "", color: "blue", description: "" });
    },
  });

  const updateMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      tagsQuery.refetch();
      setEditingTag(null);
      setFormData({ name: "", color: "blue", description: "" });
    },
  });

  const deleteMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      tagsQuery.refetch();
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!formData.name.trim() || !editingTag) return;
    updateMutation.mutate({
      id: editingTag.id,
      ...formData,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a etiqueta "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
  };

  const getColorClass = (color: string) => {
    const option = colorOptions.find(o => o.value === color);
    return option?.class || "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Tag className="h-8 w-8" />
              Etiquetas
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize suas conversas com etiquetas coloridas
            </p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nueva Etiqueta</DialogTitle>
              <DialogDescription>
                Crie uma etiqueta para organizar suas conversas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Etiqueta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Urgente, Reagendamento..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, color: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === option.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${option.class}`} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Para que serve esta etiqueta..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim() || createMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {createMutation.isPending ? "Criando..." : "Criar Etiqueta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tagsQuery.data?.map((tag) => (
          <Card key={tag.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getColorClass(tag.color)} flex items-center justify-center`}>
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tag.name}</h3>
                  <Badge variant="outline" className="mt-1">
                    {colorOptions.find(o => o.value === tag.color)?.label || tag.color}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tag)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Etiqueta</DialogTitle>
                      <DialogDescription>
                        Atualize as informações da etiqueta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nome da Etiqueta *</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Urgente, Reagendamento..."
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor *</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {colorOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setFormData({ ...formData, color: option.value })}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                formData.color === option.value
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${option.class}`} />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Descrição (opcional)</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Para que serve esta etiqueta..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleUpdate}
                        disabled={!formData.name.trim() || updateMutation.isPending}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        {updateMutation.isPending ? "Salvando..." : "Guardar Alterações"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(tag.id, tag.name)}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {tag.description && (
              <p className="text-sm text-muted-foreground">{tag.description}</p>
            )}
          </Card>
        ))}
      </div>

      {tagsQuery.data?.length === 0 && (
        <Card className="p-12 text-center">
          <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ningunoa etiqueta criada</h3>
          <p className="text-muted-foreground mb-6">
            Crie sua primeira etiqueta para começar a organizar suas conversas
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Etiqueta
          </Button>
        </Card>
      )}
    </div>
  );
}
