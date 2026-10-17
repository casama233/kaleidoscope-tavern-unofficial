# Croaker client schema repair

The new client log preserves the previous 60 lines exactly and appends an actual rejection of scripts.initialize in yellow_croaker.entity.json. The deployed client entity retained format 1.8.0; its initialization field was invalid. This is a source defect, and BDS loading did not exercise the client parser.

Private integration 1.0.17 removes initialize and assigns the lifetime-driven AnimationAmount before AnimationAmountPrev in the supported pre_animation array, then computes rotation and blend. All four variables are written before use on the first frame. Original cod clips, geometry, texture, legacy controller and identity remain. The paired ChineseFood compatibility variant advances to 1.0.10417; prior bowl/rack, AMW and tap repairs are retained.

The family assembler now rejects scripts.initialize on effective client entities using format 1.8.0. This narrow static check is based on the actual client rejection and the legacy pre_animation/scale contract: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/cliententitydocumentation/cliententitydocumentationintroduction . It is not client rendering acceptance. Required native and stopped-save gates still precede live installation. Private logs/assets/worlds remain unpublished.
