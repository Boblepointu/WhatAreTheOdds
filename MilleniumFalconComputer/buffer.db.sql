BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "links_map" (
	"db_and_mfalcon_config_md5"	TEXT NOT NULL UNIQUE,
	"links_map"	TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "routes" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"route"	TEXT NOT NULL,
	"db_and_mfalcon_config_md5"	INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "fully_explored_universes" (
	"db_and_mfalcon_config_md5"	TEXT NOT NULL UNIQUE
);
COMMIT;
