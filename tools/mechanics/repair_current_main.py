#!/usr/bin/env python3
"""Apply only the reviewed barrel repair to main 06d941f, not the PR101 integration.
No projectile, inventory migration, host dependency or release changes occur here.
"""
import complete_barrel_repair as repair

repair.ORIGINAL = '06d941f08c1501c0320952cef5a0286485b2cb73'
repair.EXPECTED[repair.ADAPTER] = 'bb7ae009b24c23d5481cabab76e3c20cd662772c39553cb49e164aa439b5e58a'
repair.main()
