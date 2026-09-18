/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { criar, atualizar } from '@/services/unidades-grupo/server-functions';
import { IUnidade } from '@/types/unidade';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
	nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
	sigla: z.string().min(2, 'Sigla deve ter ao menos 2 caracteres').max(20, 'Sigla deve ter no máximo 20 caracteres'),
});

interface FormUnidadeProps {
	isUpdating: boolean;
	unidade?: Partial<IUnidade>;
}

export default function FormUnidade({ isUpdating, unidade }: FormUnidadeProps) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			nome: unidade?.nome || '',
			sigla: unidade?.sigla || '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		startTransition(async () => {
			if (isUpdating && unidade?.id) {
				const resp = await atualizar(unidade.id, {
					nome: values.nome,
					sigla: values.sigla,
				});

				if (resp.error) {
					toast.error('Algo deu errado', { description: resp.error });
				}

				if (resp.ok) {
					toast.success('Unidade Atualizada', { description: 'Unidade atualizada com sucesso' });
					window.location.reload();
				}
			} else {
				const { nome, sigla } = values;
				const resp = await criar({
					nome,
					sigla,
				});
				if (resp.error) {
					toast.error('Algo deu errado', { description: resp.error });
				}
				if (resp.ok) {
					toast.success('Unidade Criada', { description: 'Unidade criada com sucesso' });
					window.location.reload();
				}
			}
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-4'>
				<FormField
					control={form.control}
					name='nome'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome</FormLabel>
							<FormControl>
								<Input
									placeholder='Nome da unidade'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='sigla'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Sigla</FormLabel>
							<FormControl>
								<Input
									placeholder='Sigla da unidade'
									{...field}
									style={{ textTransform: 'uppercase' }}
									onChange={(e) => {
										field.onChange(e.target.value.toUpperCase());
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className='flex gap-2 items-center justify-end'>
					<DialogClose asChild>
						<Button variant={'outline'}>Voltar</Button>
					</DialogClose>
					<Button
						disabled={isPending}
						type='submit'>
						{isUpdating ? (
							<>
								Atualizar {isPending && <Loader2 className='animate-spin' />}
							</>
						) : (
							<>
								Adicionar {isPending && <Loader2 className='animate-spin' />}
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}

