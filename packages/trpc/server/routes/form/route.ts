import { formService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
    createFormInputModel,
    createFormOutputModel,
    getFormByIdInputModel,
    getFormByIdOutputModel,
    getMyFormsInputModel,
    getMyFormsOutputModel,
    updateFormInputModel,
    updateFormOutputModel,
    deleteFormInputModel,
    deleteFormOutputModel,
} from "./model";

const TAGS = ["Forms"];
const getPath = generatePath("/form");

export const formRouter = router({
    createForm: authenticatedProcedure
        .meta({
            openapi: { method: "POST", path: getPath("/createForm"), tags: TAGS , protect : true},
        })
        .input(createFormInputModel)
        .output(createFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { title, description, isPublic, fields } = input;

            const { id, link } = await formService.createForm(
                { title, description, isPublic, fields },
                ctx.user.id
            );

            return { id, link };
        }),

    getFormById: authenticatedProcedure
        .meta({
            openapi: { method: "GET", path: getPath("/getFormById"), tags: TAGS  , protect : true},
        })
        .input(getFormByIdInputModel)
        .output(getFormByIdOutputModel)
        .query(async ({ input, ctx }) => {
            const form = await formService.getFormById(input, ctx.user.id);
            return {
                ...form,
                isPublic: form.isPublic ?? false,
                createdAt: (form.createdAt ?? new Date()).toISOString(),
                updatedAt: (form.updatedAt ?? new Date()).toISOString(),
                description: form.description ?? null,
                createdBy: form.createdBy ?? "",
                fields: form.fields.map((f) => ({
                    ...f,
                    index: Number(f.index),
                    isRequired: f.isRequired ?? false,
                    description: f.description ?? undefined,
                    placeholder: f.placeholder ?? undefined,
                })),
            };
        }),

    getMyForms: authenticatedProcedure
        .meta({
            openapi: { method: "GET", path: getPath("/getMyForms"), tags: TAGS , protect : true },
        })
        .input(getMyFormsInputModel)
        .output(getMyFormsOutputModel)
        .query(async ({ ctx }) => {
            const forms = await formService.getMyForms(ctx.user.id);
            return forms.map((form) => ({
                ...form,
                isPublic: form.isPublic ?? false,
                createdAt: (form.createdAt ?? new Date()).toISOString(),
                updatedAt: (form.updatedAt ?? new Date()).toISOString(),
                description: form.description ?? null,
            }));
        }),

    updateForm: authenticatedProcedure
        .meta({
            openapi: { method: "PATCH", path: getPath("/updateForm"), tags: TAGS , protect : true },
        })
        .input(updateFormInputModel)
        .output(updateFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            const updated = await formService.updateForm(input, ctx.user.id);
            return {
                ...updated,
                id : updated!.id,
                isPublic: updated!.isPublic ?? false,
                title : updated?.title ?? "",
                link:updated?.link ?? "",
                description: updated!.description ?? null,
            };
        }),

    deleteForm: authenticatedProcedure
        .meta({
            openapi: { method: "DELETE", path: getPath("/deleteForm"), tags: TAGS  , protect : true},
        })
        .input(deleteFormInputModel)
        .output(deleteFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            return formService.deleteForm(input, ctx.user.id);
        }),
});