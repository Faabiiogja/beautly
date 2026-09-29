import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Só nomeia o arquivo do socket dentro do tmpdir único (não há listener TCP).
const PORT = '54329'

function pgBin(name: string): string {
  const bindir = execFileSync('pg_config', ['--bindir']).toString().trim()
  return join(bindir, name)
}

// Sobe um cluster Postgres descartável e cria o banco-template com shim + migrations.
export default function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'beautly-pg-'))
  const data = join(dir, 'data')
  const teardown = () => {
    try {
      execFileSync(pgBin('pg_ctl'), ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore' })
    } catch {
      // cluster nunca subiu ou já parou
    }
    rmSync(dir, { recursive: true, force: true })
  }

  try {
    const opts = `-p ${PORT} -k ${dir} -c listen_addresses=`
    execFileSync(pgBin('initdb'), ['-D', data, '-A', 'trust', '-U', 'postgres'], { stdio: 'ignore' })
    execFileSync(pgBin('pg_ctl'), ['-D', data, '-o', opts, '-l', join(dir, 'log'), '-w', 'start'], {
      stdio: 'ignore',
    })

    const psql = (db: string, args: string[]) =>
      execFileSync('psql', ['-h', dir, '-p', PORT, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-q', ...args], {
        stdio: ['ignore', 'ignore', 'inherit'],
      })

    psql('postgres', ['-c', 'create database beautly_template'])
    psql('beautly_template', ['-f', join(__dirname, 'supabase-shim.sql')])
    const migrations = join(__dirname, '../../supabase/migrations')
    for (const file of readdirSync(migrations).sort()) {
      psql('beautly_template', ['-f', join(migrations, file)])
    }

    process.env.TEST_PG_HOST = dir
    process.env.TEST_PG_PORT = PORT
  } catch (error) {
    teardown()
    throw error
  }

  return teardown
}
