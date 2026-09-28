import authService from "@repo/services/auth"
import FormService from "@repo/services/form"
import FormFieldService from "@repo/services/form_feild"
import FormSnapshotService from "@repo/services/form_snapshot"

export const authServiceInstance = new authService()
export const formServiceInstance = new FormService()
export const formFieldServiceInstance = new FormFieldService()
export const formSnapshotServiceInstance = new FormSnapshotService()