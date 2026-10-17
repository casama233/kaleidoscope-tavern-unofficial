"""Standing authorization accepts the reviewed edition and rejects weaker wording."""
import unittest

from family_update.deploy_live import deployment_authorized


CURRENT = """# Senluo maintenance

Scope: Senluo family work on this host. These are the owner's standing requirements (2026-09-30 through 2026-10-11), consolidated on 2026-10-16. Later explicit user instructions take precedence.

- The owner's 2026-10-03 standing authorization requires deployment of every completed functional candidate after canonical PR/checks/merge and full-family static, BDS and saved-world gates. Backups, normal stop/start and policy registration are authorized. Do not wait for client acceptance or request the same permission again. Before deployment read `/var/lib/docker/volumes/bsm_data/_data/plugins/addon_quality/senluo-policy.json`; use canonical family_bundle/family_guard without bypass or receipt rewriting. Register authorization provenance/time and this candidate's exact reviewed receipt SHA256 in deferred_client_acceptance. Keep client=false, production_ready=false and pending_client_acceptance until human verification. Never claim BDS/script success proves rendered gameplay; no simulated players or experimental features on LIVE.
"""


class DeploymentAuthorizationTests(unittest.TestCase):
    def test_reviewed_consolidated_edition_accepts_unrelated_instructions(self):
        self.assertTrue(deployment_authorized(CURRENT + '\n- Preserve concurrent work.\n'))

    def test_legacy_reviewed_literals_remain_compatible(self):
        legacy = '使用者已持續授權，供使用者直接測試開發效果，登記 `deferred_client_acceptance`。'
        self.assertTrue(deployment_authorized(legacy))
        for text in ['使用者已持續授權', '供使用者直接測試開發效果', '`deferred_client_acceptance`']:
            with self.subTest(text=text):
                self.assertFalse(deployment_authorized(legacy.replace(text, '')))

    def test_changed_or_missing_permission_and_gates_require_rereview(self):
        for text in [
            '2026-10-03 standing authorization',
            'canonical PR/checks/merge and full-family static, BDS and saved-world gates',
            'Backups, normal stop/start and policy registration are authorized.',
            'Do not wait for client acceptance or request the same permission again.',
            '/var/lib/docker/volumes/bsm_data/_data/plugins/addon_quality/senluo-policy.json',
            'use canonical family_bundle/family_guard without bypass or receipt rewriting',
            "Register authorization provenance/time and this candidate's exact reviewed receipt SHA256 in deferred_client_acceptance.",
            'client=false, production_ready=false and pending_client_acceptance until human verification',
            'no simulated players or experimental features on LIVE',
        ]:
            with self.subTest(text=text):
                self.assertFalse(deployment_authorized(CURRENT.replace(text, 'REVIEW REQUIRED')))

    def test_fragments_or_different_edition_do_not_authorize_deployment(self):
        self.assertFalse(deployment_authorized(CURRENT.split('\n\n')[-1]))
        for text in ['# Senluo maintenance', 'consolidated on 2026-10-16.']:
            with self.subTest(text=text):
                self.assertFalse(deployment_authorized(CURRENT.replace(text, 'different edition')))
        self.assertFalse(deployment_authorized('Backups, normal stop/start and policy registration are authorized.'))


if __name__ == '__main__':
    unittest.main()
