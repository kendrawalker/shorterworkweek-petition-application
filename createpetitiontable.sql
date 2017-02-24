-- create user, signature, userprofle tables

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS petitioners;
DROP TABLE IF EXISTS signatures;


CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(250) not null,
    last_name VARCHAR(250) not null,
    email_address VARCHAR(250) UNIQUE not null,
    password VARCHAR not null
);

CREATE TABLE signatures (
    id SERIAL primary key,
    user_id INTEGER not null,
    signature TEXT not null
);

CREATE TABLE user_profiles (
    id SERIAL primary key,
    user_id INTEGER not null,
    age INTEGER,
    city VARCHAR(250),
    homepage VARCHAR(250)
);


select * from users;
select * from petitioners;
select * from user_profiles;
