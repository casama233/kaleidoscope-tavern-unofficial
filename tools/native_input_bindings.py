"""Pinned native edit-box inheritance and explicit scoped bindings.

No UI patch directives, invented controller fields or forced enabled binding
types. Production single-line inputs and isolated multiline probes share this
source contract; neither structural checks nor Python evaluate a client UI.
"""
import copy

PIN = '46ba6ea985fb5a92d79a9419198f10dda14c199d'
NAMESPACES = {'ui_common.json': 'common',
              'settings_sections/settings_common.json': 'settings_common',
              'server_form.json': 'server_form'}
NATIVE_TARGETS = {'enabled': '#enabled', 'focus': '#focus_enabled', 'visible': '#visible'}


def native_definitions(reference):
    if reference['commit'] != PIN:
        raise ValueError('Native input source pin changed; review required')
    result = {}
    for filename, namespace in NAMESPACES.items():
        for key, node in reference['files'][filename]['nodes'].items():
            name, _, parent = key.partition('@')
            result[namespace + '.' + name] = (parent, node)
    return result


def resolve_control(reference, name, overrides=None, definitions=None, seen=()):
    """Resolve actual inherited type/arrays, retaining native child controls.

    Direct array properties replace inherited arrays; new definitions cannot
    append them through an unapplied `modifications` property.
    """
    definitions = native_definitions(reference) if definitions is None else definitions
    if name in seen or name not in definitions:
        raise ValueError('Missing or cyclic native input definition: ' + name)
    parent, node = definitions[name]
    value = resolve_control(reference, parent, definitions=definitions, seen=(*seen, name)) if parent else {}
    value.update(copy.deepcopy(node))
    if overrides is not None:
        value.update(copy.deepcopy(overrides))
    return value


def scoped_input(reference, base, selector, prefix):
    native = resolve_control(reference, base)
    if native.get('type') != 'edit_box':
        raise ValueError('Scoped input must inherit a native edit_box')
    original = native['bindings']
    if len(original) != 6:
        raise ValueError('Pinned native root bindings changed; review required')
    aliases = {kind: prefix + '_native_' + kind for kind in NATIVE_TARGETS}
    # option_text_edit_control explicitly uses $enabled. Its native variables
    # may make the enabled binding `none`; keep that native choice and fallback.
    # common.text_edit_box/probe default enabled is true before its controller
    # binding resolves. Native focus and visibility defaults are also true.
    defaults = {aliases['enabled']: native['enabled'] if native['enabled'] == '$enabled' else True,
                aliases['focus']: native['focus_enabled'],
                aliases['visible']: native.get('visible', True)}
    bindings = copy.deepcopy(original)
    for kind, target in NATIVE_TARGETS.items():
        matches = [row for row in original if row.get('binding_name_override') == target]
        if len(matches) != 1:
            raise ValueError('Ambiguous native input binding: ' + target)
        alias = copy.deepcopy(matches[0])
        alias['binding_name_override'] = aliases[kind]
        bindings.append(alias)
    bindings.extend([
        {'binding_name': '#title_text', 'binding_name_override': prefix + '_title'},
        {'binding_type': 'collection', 'binding_collection_name': 'custom_form',
         'binding_name': '#custom_text', 'binding_name_override': prefix + '_field'},
    ])
    enabled = '(' + selector + ' and ' + aliases['visible'] + ' and $enabled and ' + aliases['enabled'] + ')'
    expressions = {'visible': '(' + selector + ' and ' + aliases['visible'] + ')',
                   'enabled': enabled,
                   'focus': '(' + enabled + ' and ' + aliases['focus'] + ')'}
    for kind in ('visible', 'enabled', 'focus'):
        bindings.append({'binding_type': 'view', 'source_property_name': expressions[kind],
                         'target_property_name': NATIVE_TARGETS[kind]})
    # Pinned common.slot_selected uses visible:false with a #visible binding.
    # Keep native enabled/focus defaults; visibility fails closed until title/
    # collection selection resolves. Gates never read their own target values.
    return {'visible': False, 'enabled': native['enabled'], 'focus_enabled': native['focus_enabled'],
            'property_bag': {**copy.deepcopy(native.get('property_bag', {})), **defaults},
            '$text_edit_box_binding_condition': 'visible', 'bindings': bindings}
