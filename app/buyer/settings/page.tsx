"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
  updateMe,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Address = {
  address_id: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: number | boolean;
};

type AddressResponse = {
  addresses?: Address[];
};

type UserResponse = {
  user: {
    id: string;
    email: string;
    role: "buyer" | "seller" | "admin";
  };
};

export default function BuyerSettingsPage() {
  const { token } = useStoredToken();
  const { user, setUser } = useStoredUser();
  const [email, setEmail] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [addressStatus, setAddressStatus] = useState("");

  const loadAddresses = async () => {
    if (!token) {
      return;
    }
    setAddressStatus("");
    try {
      const data = (await getAddresses(token)) as AddressResponse;
      setAddresses(data?.addresses || []);
    } catch (error) {
      setAddressStatus(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!token || !user || user.role !== "buyer") {
      return;
    }
    loadAddresses();
  }, [token, user]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setProfileStatus("");
    try {
      const response = (await updateMe(email, token)) as UserResponse;
      if (response?.user) {
        setUser(response.user);
      }
      setProfileStatus("Profile updated.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId("");
    setStreet("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("");
    setIsDefault(false);
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setAddressStatus("");
    try {
      if (editingAddressId) {
        await updateAddress(
          editingAddressId,
          {
            street_address: street,
            city,
            state,
            postal_code: postalCode,
            country,
            is_default: isDefault,
          },
          token
        );
      } else {
        await createAddress(
          {
            street_address: street,
            city,
            state,
            postal_code: postalCode,
            country,
            is_default: isDefault,
          },
          token
        );
      }
      resetAddressForm();
      await loadAddresses();
    } catch (error) {
      setAddressStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.address_id);
    setStreet(address.street_address || "");
    setCity(address.city || "");
    setState(address.state || "");
    setPostalCode(address.postal_code || "");
    setCountry(address.country || "");
    setIsDefault(Boolean(address.is_default));
    setAddressStatus("Editing address. Submit to save changes.");
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!token) {
      return;
    }
    setAddressStatus("");
    try {
      await deleteAddress(addressId, token);
      setAddresses((prev) => prev.filter((address) => address.address_id !== addressId));
    } catch (error) {
      setAddressStatus(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Settings</span>
              <h1 className="section-title font-display">Account Preferences</h1>
              <p className="section-subtitle">
                Update your contact details and shipping addresses.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Buyer workspace</h2>
              <p className="panel-desc">
                Build a buyer profile to save favorites, track orders, and set alerts.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Become a buyer
            </Link>
          </div>
        ) : null}

        {user && user.role !== "buyer" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to buyer profile</h2>
              <p className="panel-desc">
                Use a buyer profile to manage orders, alerts, and reviews.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "buyer" ? (
          <div className="stack">
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Profile</h3>
                <p className="panel-desc">Keep your email up to date.</p>
              </div>
              <form className="field-grid" onSubmit={handleEmailSubmit}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required
                />
                <button className="btn-primary" type="submit">
                  Save email
                </button>
                {profileStatus ? <p className="helper-text">{profileStatus}</p> : null}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">
                  {editingAddressId ? "Edit address" : "Add address"}
                </h3>
                <p className="panel-desc">Manage where orders ship.</p>
              </div>
              <form className="field-grid" onSubmit={handleAddressSubmit}>
                <input
                  className="input"
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
                  placeholder="Street address"
                  required
                />
                <input
                  className="input"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City"
                  required
                />
                <input
                  className="input"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  placeholder="State"
                  required
                />
                <input
                  className="input"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  placeholder="Postal code"
                  required
                />
                <input
                  className="input"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Country"
                  required
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(event) => setIsDefault(event.target.checked)}
                  />
                  <span>Set as default</span>
                </label>
                <div className="toolbar">
                  <button className="btn-primary" type="submit">
                    {editingAddressId ? "Save address" : "Add address"}
                  </button>
                  {editingAddressId ? (
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        resetAddressForm();
                        setAddressStatus("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                {addressStatus ? <p className="helper-text">{addressStatus}</p> : null}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Saved addresses</h3>
                <p className="panel-desc">Available destinations.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Postal</th>
                      <th>Country</th>
                      <th>Default</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.length ? (
                      addresses.map((address) => (
                        <tr key={address.address_id}>
                          <td>{address.street_address}</td>
                          <td>{address.city}</td>
                          <td>{address.state}</td>
                          <td>{address.postal_code}</td>
                          <td>{address.country}</td>
                          <td>{address.is_default ? "Yes" : "No"}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleEditAddress(address)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleDeleteAddress(address.address_id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="helper-text">
                          No addresses yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
