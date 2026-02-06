import json
import click
from web3 import Web3
from contract_interface import w3, load_abi, load_addresses, sign_and_send_raw, get_account

# Load deployed contract addresses
ADD = load_addresses("../deployed/addresses.json")

REG = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["registry"]),
    abi=load_abi("../deployed/MRVRegistry.json")
)

VM = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["verificationManager"]),
    abi=load_abi("../deployed/VerificationManager.json")
)

TOKEN = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["token"]),
    abi=load_abi("../deployed/CarbonCreditToken.json")
)

@click.group()
def cli():
    """Admin tools for MRV Registry + VerificationManager."""
    pass


# ---------------------- SHOW OWNER --------------------------
@cli.command()
def owner():
    """Show the owner of the registry."""
    owner_addr = REG.functions.owner().call()
    click.echo(f"Registry owner: {owner_addr}")


# ---------------------- SHOW PROJECT -------------------------
@cli.command()
@click.argument("project_id", type=int)
def show(project_id):
    """Show details of a project"""
    p = REG.functions.projects(project_id).call()
    click.echo(f"ID: {p[0]}")
    click.echo(f"Submitter: {p[1]}")
    click.echo(f"Metadata URI: {p[2]}")
    click.echo(f"Claimed Tons: {p[3]}")
    click.echo(f"Approved Tons: {p[4]}")
    click.echo(f"Status: {p[5]}")
    click.echo(f"Submitted At: {p[6]}")
    click.echo(f"Updated At: {p[7]}")
@cli.command(name="add-verifier")
@click.argument("address")
def add_verifier(address):
    """Adds a verifier address (owner-only)."""
    tx = REG.functions.addVerifier(address).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Verifier added. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- REMOVE VERIFIER -----------------------
@cli.command(name="remove-verifier")
@click.argument("address")
def remove_verifier(address):
    tx = REG.functions.removeVerifier(address).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Verifier removed. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- SET UNDER REVIEW ----------------------
@cli.command(name="under-review")
@click.argument("project_id", type=int)
def under_review(project_id):
    tx = REG.functions.setUnderReview(project_id).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Project moved to UnderReview. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- APPROVE PROJECT -----------------------
@cli.command()
@click.argument("project_id", type=int)
@click.argument("tons", type=int)
def approve(project_id, tons):
    tx = REG.functions.approveProject(project_id, tons).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Project approved. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- REJECT PROJECT ------------------------
@cli.command()
@click.argument("project_id", type=int)
def reject(project_id):
    tx = REG.functions.rejectProject(project_id).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Project rejected. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- SUBMIT PROJECT ------------------------
@cli.command()
@click.argument("metadata_uri")
@click.argument("claimed_tons", type=int)
def submit(metadata_uri, claimed_tons):
    tx = REG.functions.submitProject(metadata_uri, claimed_tons).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    pid = REG.functions.nextProjectId().call() - 1  # since it increments after
    click.echo(f"Project submitted with ID {pid}. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())


# ---------------------- ISSUE CREDITS -------------------------
@cli.command()
@click.argument("project_id", type=int)
@click.argument("recipient")
def issue(project_id, recipient):
    tx = VM.functions.issueCredits(project_id, recipient).build_transaction({"from": get_account()})
    receipt = sign_and_send_raw(tx)
    click.echo("Credits issued. Tx:", nl=False)
    click.echo(receipt.transactionHash.hex())

if __name__ == "__main__":
    cli()
